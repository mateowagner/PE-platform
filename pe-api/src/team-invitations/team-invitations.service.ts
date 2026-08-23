// pe-api/src/modules/team-invitations/team-invitations.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/entities/user.entity';
import {
  Tournament,
  TournamentStatus,
} from '../tournaments/entities/tournament.entity';
import {
  TeamInvitation,
  InvitationStatus,
} from './entities/team-invitation.entity';

@Injectable()
export class TeamInvitationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TeamInvitation)
    private readonly invitationRepository: Repository<TeamInvitation>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  async sendInvitation(
    teamId: string,
    inviterId: string,
    inviteeId: string,
  ): Promise<TeamInvitation> {
    await this.assertTeamNotInActiveTournament(teamId);

    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['owner', 'members'],
    });

    if (!team) throw new NotFoundException('El equipo no existe.');
    if (team.owner.id !== inviterId) {
      throw new ForbiddenException(
        'Solo el capitán del equipo puede enviar invitaciones.',
      );
    }
    if (team.members.length >= 7) {
      throw new ConflictException(
        'Tu equipo ya tiene 7 jugadores. No puedes enviar más invitaciones.',
      );
    }

    const invitee = await this.userRepository.findOne({
      where: { id: inviteeId },
      relations: ['team'],
    });

    if (!invitee)
      throw new NotFoundException('El jugador que intentas invitar no existe.');
    if (invitee.team) {
      throw new ConflictException('El jugador ya pertenece a otro equipo.');
    }
    if (!invitee.riotPuuid) {
      throw new BadRequestException(
        'El jugador no ha vinculado su cuenta de Riot Games.',
      );
    }

    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        team: { id: teamId },
        userInvited: { id: inviteeId },
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      if (existingInvitation.expiresAt > new Date()) {
        throw new ConflictException(
          'Ya has enviado una invitación a este jugador que aún está pendiente de respuesta.',
        );
      }
      existingInvitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(existingInvitation);
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const newInvitation = this.invitationRepository.create({
      team,
      adminInviter: { id: inviterId } as User,
      userInvited: invitee,
      expiresAt: expirationDate,
      status: InvitationStatus.PENDING,
    });

    return this.invitationRepository.save(newInvitation);
  }

  async acceptInvitation(userId: string, invitationId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lock pesimista puro sobre la fila de la invitación sin joins
      const invitationLock = await queryRunner.manager
        .createQueryBuilder(TeamInvitation, 'invitation')
        .setLock('pessimistic_write')
        .where('invitation.id = :invitationId', { invitationId })
        .getOne();

      if (!invitationLock) {
        throw new NotFoundException('La invitación no existe.');
      }

      // 2. Cargar datos y relaciones sin lock
      const invitation = await queryRunner.manager.findOne(TeamInvitation, {
        where: { id: invitationId },
        relations: ['userInvited', 'team'],
      });

      if (!invitation) throw new NotFoundException('La invitación no existe.');

      if (invitation.userInvited.id !== userId) {
        throw new ForbiddenException(
          'No tienes permiso para aceptar esta invitación.',
        );
      }
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new ConflictException(
          `La invitación ya no está pendiente (Estado: ${invitation.status}).`,
        );
      }
      if (new Date() > invitation.expiresAt) {
        invitation.status = InvitationStatus.EXPIRED;
        await queryRunner.manager.save(TeamInvitation, invitation);
        throw new ConflictException('La invitación ha expirado.');
      }

      await this.assertTeamNotInActiveTournament(invitation.team.id);

      // 3. Lock pesimista puro sobre el usuario
      const userLock = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId })
        .getOne();

      if (!userLock) throw new NotFoundException('El usuario no existe.');

      const userWithTeam = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['team'],
      });

      if (userWithTeam?.team) {
        throw new ConflictException(
          'Ya perteneces a un equipo. Debes salir de tu equipo actual primero.',
        );
      }

      // 4. Lock pesimista puro sobre el equipo
      const teamLock = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .setLock('pessimistic_write')
        .where('team.id = :teamId', { teamId: invitation.team.id })
        .getOne();

      if (!teamLock) throw new NotFoundException('El equipo no existe.');

      const teamMembersCount = await queryRunner.manager.count(User, {
        where: { team: { id: invitation.team.id } },
      });

      if (teamMembersCount >= 7) {
        throw new ConflictException(
          'El equipo ya ha alcanzado el límite máximo de 7 jugadores.',
        );
      }

      // 5. Mutaciones
      userLock.team = teamLock;
      await queryRunner.manager.save(User, userLock);

      invitation.status = InvitationStatus.ACCEPTED;
      await queryRunner.manager.save(TeamInvitation, invitation);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectInvitation(userId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['userInvited'],
    });

    if (!invitation) throw new NotFoundException('La invitación no existe.');
    if (invitation.userInvited.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para rechazar esta invitación.',
      );
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException(
        `La invitación ya no está pendiente (Estado: ${invitation.status}).`,
      );
    }
    if (new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new ConflictException('La invitación ha expirado.');
    }

    invitation.status = InvitationStatus.REJECTED;
    await this.invitationRepository.save(invitation);
  }

  async getInvitationById(invitationId: string): Promise<TeamInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['team', 'adminInviter', 'userInvited'],
    });
    if (!invitation) throw new NotFoundException('La invitación no existe.');
    return invitation;
  }

  async getInvitationsByUserId(userId: string): Promise<TeamInvitation[]> {
    return this.invitationRepository.find({
      where: { userInvited: { id: userId }, status: InvitationStatus.PENDING },
      relations: ['team', 'userInvited', 'adminInviter'],
      order: { createdAt: 'DESC' },
    });
  }

  private async assertTeamNotInActiveTournament(teamId: string): Promise<void> {
    const activeTournaments = await this.tournamentRepository.find({
      where: {
        teams: { id: teamId },
        status: TournamentStatus.STARTED,
      },
    });

    if (activeTournaments.length > 0) {
      throw new ConflictException(
        'Roster Lock activo: No se pueden procesar invitaciones para un equipo en torneo activo.',
      );
    }
  }
}
