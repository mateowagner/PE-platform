import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/entities/user.entity';
import {
  TeamInvitation,
  InvitationStatus,
} from './entities/team-invitation.entity';
@Injectable()
export class TeamInvitationsService {
  // Inyectamos el DataSource global para tener control absoluto de las conexiones
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TeamInvitation)
    private readonly invitationRepository: Repository<TeamInvitation>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async sendInvitation(
    teamId: string,
    inviterId: string,
    inviteeId: string,
  ): Promise<TeamInvitation> {
    // 1. Buscar el equipo y sus relaciones vitales
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['owner', 'members'],
    });

    if (!team) {
      throw new NotFoundException('El equipo no existe.');
    }

    // 2. Validar Autorización (Solo el dueño del equipo puede invitar)
    if (team.owner.id !== inviterId) {
      throw new ForbiddenException(
        'Solo el capitán del equipo puede enviar invitaciones.',
      );
    }

    // 3. Validar Cupo Activo
    if (team.members.length >= 7) {
      throw new ConflictException(
        'Tu equipo ya tiene 7 jugadores. No puedes enviar más invitaciones.',
      );
    }

    // 4. Buscar al jugador que queremos invitar
    const invitee = await this.userRepository.findOne({
      where: { id: inviteeId },
    });

    if (!invitee) {
      throw new NotFoundException('El jugador que intentas invitar no existe.');
    }

    // 5. PATRÓN DEFENSIVO: Buscar si ya existe una invitación pendiente
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        team: { id: teamId },
        userInvited: { id: inviteeId },
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      // ¿Por qué verificamos si expiró? Porque si hay una pendiente pero está vencida,
      // dejamos que el flujo siga y la base de datos creará una nueva sin chocar.
      if (existingInvitation.expiresAt > new Date()) {
        throw new ConflictException(
          'Ya has enviado una invitación a este jugador que aún está pendiente de respuesta.',
        );
      }
    }

    // 6. Crear y guardar la invitación (Validez: 7 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const newInvitation = this.invitationRepository.create({
      team,
      adminInviter: { id: inviterId } as User, // Usamos as User para pasar solo la referencia del ID
      userInvited: invitee,
      expiresAt: expirationDate,
    });

    return await this.invitationRepository.save(newInvitation);
  }
  async acceptInvitation(userId: string, invitationId: string): Promise<void> {
    // 1. Instanciamos la conexión exclusiva
    const queryRunner = this.dataSource.createQueryRunner();

    // 2. Conectamos e iniciamos la transacción SQL
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // --- PASO A: Validar Invitación ---
      const invitation = await queryRunner.manager.findOne(TeamInvitation, {
        where: { id: invitationId, status: InvitationStatus.PENDING },
        relations: ['userInvited', 'team'],
      });

      if (!invitation) {
        throw new NotFoundException('La invitación no existe.');
      }

      if (invitation.userInvited.id !== userId) {
        throw new BadRequestException(
          'No tienes permiso para aceptar esta invitación.',
        );
      }

      /*if (invitation.status !== InvitationStatus.PENDING) {
        throw new ConflictException(
          `La invitación ya no está pendiente (Estado: ${invitation.status}).`,
        );
      }*/

      if (new Date() > invitation.expiresAt) {
        // Podríamos actualizar el estado a EXPIRED acá mismo, pero por SRP
        // lanzamos el error directo. Un Cronjob o lectura perezosa limpiará la tabla.
        throw new ConflictException('La invitación ha expirado.');
      }

      // --- PASO B: Validar Usuario ---
      // Bloqueamos la fila del usuario por seguridad
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        //relations: ['team'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new NotFoundException('El usuario no existe.');
      }

      if (user.team) {
        throw new ConflictException(
          'Ya perteneces a un equipo. Debes salir de tu equipo actual primero.',
        );
      }
      // --- PASO C: Validar Cupo de Equipo (El Lock crítico) ---
      // Secuestramos la fila del equipo para evitar Condiciones de Carrera

      const team = await queryRunner.manager.findOne(Team, {
        where: { id: invitation.team.id },
        //relations: ['members'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!team) {
        throw new NotFoundException('El equipo no existe.');
      }
      const teamMembersCount = await queryRunner.manager.count(User, {
        where: { team: { id: invitation.team.id } },
        //lock: { mode: 'pessimistic_write' },
      });
      if (teamMembersCount >= 7) {
        throw new ConflictException(
          'El equipo ya ha alcanzado el límite máximo de 7 jugadores.',
        );
      }

      // --- PASO D: Ejecutar Mutaciones ---
      // 1. Asignar el equipo al usuario
      user.team = team;

      await queryRunner.manager.save(User, user);

      // 2. Cambiar el estado de la invitación
      invitation.status = InvitationStatus.ACCEPTED;
      await queryRunner.manager.save(TeamInvitation, invitation);

      // --- PASO E: Confirmar Transacción ---
      await queryRunner.commitTransaction();
    } catch (error) {
      // Si CUALQUIER validación falla o la DB tira un error, deshacemos todo
      await queryRunner.rollbackTransaction();
      // Relanzamos el error para que NestJS devuelva el 400/404/409 al frontend
      throw error;
    } finally {
      // CRÍTICO: Liberamos la conexión exclusiva para no agotar el pool
      await queryRunner.release();
    }
  }

  async rejectInvitation(userId: string, invitationId: string): Promise<void> {
    // 1. Buscar la invitación (con la relación del jugador para validar autoría)
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, status: InvitationStatus.PENDING },
      relations: ['userInvited'],
    });

    // 2. Validar que exista
    if (!invitation) {
      throw new NotFoundException('La invitación no existe.');
    }

    // 3. Validar Autorización (¡Seguridad crítica!)
    if (invitation.userInvited.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para rechazar esta invitación.',
      );
    }

    // 4. Validar estado PENDING
    /*if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException(
        `La invitación ya no está pendiente (Estado: ${invitation.status}).`,
      );
    }*/

    // 5. Validar que no esté expirada
    if (new Date() > invitation.expiresAt) {
      throw new ConflictException('La invitación ya ha expirado.');
    }

    // 6. Ejecutar la mutación
    invitation.status = InvitationStatus.REJECTED;
    await this.invitationRepository.save(invitation);
  }
  async getInvitationById(invitationId: string): Promise<TeamInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['team', 'adminInviter', 'userInvited'],
    });
    if (!invitation) {
      throw new NotFoundException('La invitación no existe.');
    }
    return invitation;
  }
  async getInvitationsByUserId(userId: string): Promise<TeamInvitation[]> {
    return await this.invitationRepository.find({
      where: { userInvited: { id: userId }, status: InvitationStatus.PENDING },
      relations: ['team', 'userInvited'],
      order: { createdAt: 'DESC' },
    });
  }
}
