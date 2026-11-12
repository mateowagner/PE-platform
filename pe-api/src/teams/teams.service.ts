// pe-api/src/modules/teams/teams.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import {
  Tournament,
  TournamentStatus,
} from '../tournaments/entities/tournament.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tournament)
    private readonly tournamentsRepository: Repository<Tournament>,
  ) {}

  async createWithOwner(dto: CreateTeamDto, userId: string): Promise<Team> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo pesimista sobre la tabla users sin JOINs
      const user = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId })
        .getOne();

      if (!user) throw new NotFoundException('Usuario no encontrado.');

      // Validar si ya tiene equipo
      const userWithTeam = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['team'],
      });

      if (userWithTeam?.team)
        throw new ConflictException('Ya perteneces a un equipo.');
      if (!user.riotPuuid) {
        throw new ConflictException(
          'Necesitas vincular tu cuenta de Riot antes de crear un equipo.',
        );
      }
      const logo = 'logo_url' in dto ? dto.logo_url : undefined;
      const team = queryRunner.manager.create(Team, {
        name: dto.name,
        logoUrl: logo,
        owner: user,
      });
      const savedTeam = await queryRunner.manager.save(Team, team);

      user.team = savedTeam;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      const createdTeam = await this.findOne(savedTeam.id);
      if (!createdTeam)
        throw new NotFoundException('Error al recuperar el equipo creado.');
      return createdTeam;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByMember(userId: string): Promise<Team | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['team'],
    });
    if (!user?.team) return null;

    return this.findOne(user.team.id);
  }

  async findAll(): Promise<Team[]> {
    return this.teamsRepository.find({ relations: ['owner'] });
  }

  async findOne(id: string): Promise<Team | null> {
    return this.teamsRepository.findOne({
      where: { id },
      relations: ['members', 'owner'],
    });
  }

  async update(id: string, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) throw new NotFoundException(`Team con id ${id} no encontrado.`);

    if (dto.name) {
      team.name = dto.name;
    }
    if (dto.logo_url !== undefined) {
      team.logoUrl = dto.logo_url;
    }

    return this.teamsRepository.save(team);
  }

  async remove(id: string): Promise<void> {
    await this.assertTeamNotInActiveTournament(id);
    const result = await this.teamsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Team con id ${id} no encontrado.`);
    }
  }

  async getMembers(id: string): Promise<User[]> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!team) throw new NotFoundException(`Team con id ${id} no encontrado.`);
    return team.members;
  }

  async removeMember(
    teamId: string,
    captainId: string,
    memberId: string,
  ): Promise<Team> {
    await this.assertTeamNotInActiveTournament(teamId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo atómico puro sobre la fila del equipo (sin joins)
      const team = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .setLock('pessimistic_write')
        .where('team.id = :teamId', { teamId })
        .getOne();

      if (!team)
        throw new NotFoundException('El equipo especificado no existe.');

      // Consultar el owner por separado para evitar outer joins con lock
      const teamWithOwner = await queryRunner.manager.findOne(Team, {
        where: { id: teamId },
        relations: ['owner'],
      });

      if (teamWithOwner?.owner.id !== captainId) {
        throw new ForbiddenException(
          'Operación denegada. Solo el capitán puede remover miembros.',
        );
      }
      if (memberId === captainId) {
        throw new BadRequestException(
          'No puedes eliminarte a ti mismo del equipo. Utiliza la opción de salir o transfiere la capitanía.',
        );
      }

      // 2. Bloqueo atómico puro sobre la fila del miembro (sin joins)
      const member = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .where('user.id = :memberId', { memberId })
        .getOne();

      if (!member) {
        throw new BadRequestException('El jugador especificado no existe.');
      }

      // Validar pertenencia del usuario
      const memberWithTeam = await queryRunner.manager.findOne(User, {
        where: { id: memberId },
        relations: ['team'],
      });

      if (!memberWithTeam?.team || memberWithTeam.team.id !== teamId) {
        throw new BadRequestException(
          'El jugador especificado no pertenece a este equipo.',
        );
      }

      // 3. Romper relación actualizando la FK
      member.team = null as unknown as Team;
      await queryRunner.manager.save(User, member);

      await queryRunner.commitTransaction();

      const updatedTeam = await this.findOne(teamId);
      if (!updatedTeam)
        throw new NotFoundException(
          'Error al recuperar el equipo actualizado.',
        );
      return updatedTeam;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async leaveTeam(userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cargar el equipo con su dueño y miembros
      const team = await queryRunner.manager.findOne(Team, {
        where: { members: { id: userId } },
        relations: ['owner', 'members'],
      });

      if (!team) {
        throw new NotFoundException('No perteneces a ningún equipo.');
      }

      // 2. Obtener la entidad del usuario que sale para desvincularlo formalmente
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const isOwner = team.owner?.id === userId;

      // 3. Caso: Es el Capitán / Dueño
      if (isOwner) {
        // Si hay otros miembros, se transfiere la capitanía al siguiente integrante
        const remainingMembers = team.members.filter((m) => m.id !== userId);

        if (remainingMembers.length > 0) {
          team.owner = remainingMembers[0];
          team.members = remainingMembers;
          await queryRunner.manager.save(Team, team);
        } else {
          // Si era el único integrante, se debe validar que no esté en un torneo en curso
          // antes de disolver el equipo
          await queryRunner.manager.remove(Team, team);
        }
      } else {
        // 4. Caso: Es un miembro regular
        team.members = team.members.filter((m) => m.id !== userId);
        await queryRunner.manager.save(Team, team);
      }

      // 5. Desvincular explícitamente al usuario para limpiar su foreign key (team_id = null)
      user.team = null as unknown as Team;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transferOwnership(
    teamId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<Team> {
    if (currentOwnerId === newOwnerId) {
      throw new BadRequestException('Ya eres el capitán de este equipo.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo puro sobre el equipo
      const team = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .setLock('pessimistic_write')
        .where('team.id = :teamId', { teamId })
        .getOne();

      if (!team) throw new NotFoundException('El equipo no existe.');

      const teamWithOwner = await queryRunner.manager.findOne(Team, {
        where: { id: teamId },
        relations: ['owner'],
      });

      if (teamWithOwner?.owner.id !== currentOwnerId) {
        throw new ForbiddenException(
          'Solo el capitán actual puede transferir la capitanía.',
        );
      }

      // 2. Bloqueo puro sobre el nuevo dueño
      const newOwner = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .where('user.id = :newOwnerId', { newOwnerId })
        .getOne();

      if (!newOwner) {
        throw new BadRequestException('El usuario designado no existe.');
      }

      const newOwnerWithTeam = await queryRunner.manager.findOne(User, {
        where: { id: newOwnerId },
        relations: ['team'],
      });

      if (newOwnerWithTeam?.team?.id !== teamId) {
        throw new BadRequestException(
          'El nuevo capitán debe ser un miembro activo del equipo.',
        );
      }

      team.owner = newOwner;
      await queryRunner.manager.save(Team, team);

      await queryRunner.commitTransaction();

      const updatedTeam = await this.findOne(teamId);
      if (!updatedTeam)
        throw new NotFoundException('Error al recuperar el equipo.');
      return updatedTeam;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async assertTeamNotInActiveTournament(teamId: string): Promise<void> {
    const activeTournaments = await this.tournamentsRepository.find({
      where: {
        teams: { id: teamId },
        status: TournamentStatus.STARTED,
      },
    });

    if (activeTournaments.length > 0) {
      throw new ConflictException(
        'Roster Lock activo: No se pueden realizar modificaciones ni abandonar el equipo mientras compite en torneos en progreso.',
      );
    }
  }
}
