// pe-api/src/modules/tournaments/tournaments.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Tournament, TournamentStatus } from './entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { User } from '../users/entities/user.entity';
import {
  Serie,
  SeriesSlot,
  SeriesStatus,
} from '../series/entities/series.entity';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { RiotService } from '../riot/riot.service';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
    private readonly riotService: RiotService,
  ) {}

  async getTournamentDetails(id: string): Promise<unknown> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['teams', 'teams.members'],
    });

    if (!tournament) {
      throw new NotFoundException('El torneo no existe.');
    }

    const participantsData = tournament.teams.map((team) => {
      const tierPoints: Record<string, number> = {
        IRON: 1,
        BRONZE: 2,
        SILVER: 3,
        GOLD: 4,
        PLATINUM: 5,
        EMERALD: 6,
        DIAMOND: 7,
        MASTER: 8,
        GRANDMASTER: 9,
        CHALLENGER: 10,
      };

      const totalPoints = team.members.reduce((acc, member) => {
        return acc + (tierPoints[member.soloTier?.toUpperCase()] || 0);
      }, 0);

      const avgPoints =
        team.members.length > 0
          ? Math.round(totalPoints / team.members.length)
          : 0;

      const reverseTierMap = [
        '',
        'IRON',
        'BRONZE',
        'SILVER',
        'GOLD',
        'PLATINUM',
        'EMERALD',
        'DIAMOND',
        'MASTER',
        'GRANDMASTER',
        'CHALLENGER',
      ];

      return {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        memberCount: team.members.length,
        avgTier: reverseTierMap[avgPoints] || 'UNRANKED',
      };
    });

    return {
      ...tournament,
      teams: participantsData,
      currentTeamsCount: tournament.teams.length,
    };
  }

  async inscribeTeam(
    tournamentId: string,
    userId: string,
    teamId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo pesimista solo sobre la tabla tournaments sin JOINs
      const tournament = await queryRunner.manager
        .createQueryBuilder(Tournament, 'tournament')
        .setLock('pessimistic_write')
        .where('tournament.id = :tournamentId', { tournamentId })
        .getOne();

      if (!tournament) {
        throw new NotFoundException('El torneo no existe.');
      }

      if (tournament.status !== TournamentStatus.PREPARING) {
        throw new BadRequestException(
          'Las inscripciones para este torneo ya no están abiertas.',
        );
      }

      const now = new Date();
      if (
        now < new Date(tournament.registration_start_date) ||
        now > new Date(tournament.registration_end_date)
      ) {
        throw new ConflictException(
          'La fecha de inscripción expiró o aún no ha comenzado.',
        );
      }

      // 2. Consultar equipos actuales sin lock (el torneo ya está bloqueado)
      const currentTeams = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .innerJoin(
          'team.tournaments',
          'tournament',
          'tournament.id = :tournamentId',
          {
            tournamentId,
          },
        )
        .getMany();

      if (currentTeams.length >= tournament.max_teams) {
        throw new ConflictException(
          'El torneo ya alcanzó el cupo máximo de equipos.',
        );
      }

      if (currentTeams.some((t) => t.id === teamId)) {
        throw new ConflictException(
          'Tu equipo ya se encuentra inscripto en este torneo.',
        );
      }

      // 3. Bloquear la fila del equipo y cargar sus miembros sin joins con lock
      const team = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .setLock('pessimistic_write')
        .where('team.id = :teamId', { teamId })
        .getOne();

      if (!team) {
        throw new NotFoundException('El equipo especificado no existe.');
      }

      const teamWithDetails = await queryRunner.manager.findOne(Team, {
        where: { id: teamId },
        relations: ['owner', 'members'],
      });

      if (!teamWithDetails) {
        throw new NotFoundException('El equipo especificado no existe.');
      }

      if (teamWithDetails.owner.id !== userId) {
        throw new ForbiddenException(
          'Solo el capitán del equipo puede realizar la inscripción.',
        );
      }

      /*if (
        teamWithDetails.members.length < 5 ||
        teamWithDetails.members.length > 8
      ) {
        throw new BadRequestException(
          'El equipo debe tener entre 5 y 8 jugadores activos para inscribirse.',
        );
      }*/

      const unverifiedMember = teamWithDetails.members.find(
        (member) => !member.riotPuuid,
      );
      if (unverifiedMember) {
        const identifier =
          unverifiedMember.riotGameName ||
          unverifiedMember.username ||
          unverifiedMember.id;
        throw new BadRequestException(
          `El miembro ${identifier} no tiene una cuenta de Riot vinculada.`,
        );
      }

      // 4. Inserción atómica en la tabla intermedia
      await queryRunner.manager
        .createQueryBuilder()
        .relation(Tournament, 'teams')
        .of(tournament)
        .add(team);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelInscription(
    tournamentId: string,
    userId: string,
    teamId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo sobre el torneo sin joins
      const tournament = await queryRunner.manager
        .createQueryBuilder(Tournament, 'tournament')
        .setLock('pessimistic_write')
        .where('tournament.id = :tournamentId', { tournamentId })
        .getOne();

      if (!tournament) {
        throw new NotFoundException('El torneo no existe.');
      }

      if (tournament.status !== TournamentStatus.PREPARING) {
        throw new BadRequestException(
          'No puedes darte de baja. El torneo ya arrancó o finalizó.',
        );
      }

      const teamWithDetails = await queryRunner.manager.findOne(Team, {
        where: { id: teamId },
        relations: ['owner'],
      });

      if (!teamWithDetails || teamWithDetails.owner.id !== userId) {
        throw new ForbiddenException(
          'Solo el capitán puede dar de baja al equipo del torneo.',
        );
      }

      const currentTeams = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .innerJoin(
          'team.tournaments',
          'tournament',
          'tournament.id = :tournamentId',
          {
            tournamentId,
          },
        )
        .getMany();

      const isInscribed = currentTeams.some((t) => t.id === teamId);
      if (!isInscribed) {
        throw new BadRequestException(
          'Este equipo no está registrado en el torneo.',
        );
      }

      await queryRunner.manager
        .createQueryBuilder()
        .relation(Tournament, 'teams')
        .of(tournament)
        .remove(teamWithDetails);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async create(
    createTournamentDto: CreateTournamentDto,
    creatorId: string,
  ): Promise<Tournament> {
    const { registration_start_date, registration_end_date, start_date, name } =
      createTournamentDto;

    const regStart = new Date(registration_start_date);
    const regEnd = new Date(registration_end_date);
    const tournamentStart = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (regStart < today) {
      throw new BadRequestException(
        'La fecha de inicio de inscripción no puede estar en el pasado.',
      );
    }

    if (regEnd <= regStart) {
      throw new BadRequestException(
        'La fecha de finalización de inscripción debe ser posterior a la fecha de inicio.',
      );
    }

    if (tournamentStart <= regEnd) {
      throw new BadRequestException(
        'La fecha de inicio del torneo debe ser posterior al cierre de las inscripciones.',
      );
    }

    const webhookUrl = 'https://tu-dominio-publico.com/api/v1/matches/webhook';
    const providerId = await this.riotService.getOrCreateProviderId(webhookUrl);

    const riotTournamentId = await this.riotService.registerTournament(
      providerId,
      name,
    );

    const newTournament = this.tournamentRepository.create({
      ...createTournamentDto,
      status: TournamentStatus.PREPARING,
      current_stage: 'PRE-TORNEO',
      riot_tournament_id: String(riotTournamentId),
      created_by: { id: creatorId } as DeepPartial<User>,
    });

    return this.tournamentRepository.save(newTournament);
  }

  async findAll(): Promise<Tournament[]> {
    return this.tournamentRepository.find({
      relations: ['teams'],
    });
  }

  async findOne(id: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['teams'],
    });

    if (!tournament) {
      throw new NotFoundException(`El torneo con ID ${id} no existe.`);
    }

    return tournament;
  }

  async update(
    id: string,
    updateData: UpdateTournamentDto,
  ): Promise<Tournament> {
    const tournament = await this.findOne(id);
    Object.assign(tournament, updateData);
    return this.tournamentRepository.save(tournament);
  }

  async remove(id: string): Promise<void> {
    const tournament = await this.findOne(id);
    await this.tournamentRepository.remove(tournament);
  }

  async getTournamentSeries(tournamentId: string): Promise<Serie[]> {
    return this.seriesRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['team_a', 'team_b', 'winner', 'next_series'],
      order: { round_order: 'ASC' },
    });
  }

  async generateFixture(tournamentId: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['teams'],
    });

    if (!tournament) {
      throw new NotFoundException('El torneo especificado no existe.');
    }

    if (tournament.status !== TournamentStatus.PREPARING) {
      throw new BadRequestException(
        'El fixture ya fue generado o el torneo ya comenzó.',
      );
    }

    if (!tournament.riot_tournament_id) {
      throw new BadRequestException(
        'El torneo debe estar registrado previamente en Riot (falta riot_tournament_id).',
      );
    }

    const teams = tournament.teams;
    if (teams.length < 2) {
      throw new BadRequestException(
        'Se necesitan al menos 2 equipos para generar el fixture.',
      );
    }

    const winsRequired = 2; // Bo3
    const maxMapsPerSeries = winsRequired * 2 - 1; // 3 mapas
    const totalSeries = teams.length - 1;
    const totalMatchesNeeded = totalSeries * maxMapsPerSeries;

    const riotCodes = await this.riotService.generateTournamentCodes(
      Number(tournament.riot_tournament_id),
      totalMatchesNeeded,
      tournament.map_type,
      tournament.pick_type,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let currentRoundSeries: Serie[] = [];
      let currentRoundOrder = 1;

      for (let i = 0; i < teams.length; i += 2) {
        const teamA = teams[i];
        const teamB = teams[i + 1];

        const seriesPayload: DeepPartial<Serie> = {
          tournament,
          team_a: teamA,
          wins_required: winsRequired,
          team_a_wins: 0,
          team_b_wins: 0,
          round_order: currentRoundOrder,
          stage_name: 'Ronda 1',
          status: teamB ? SeriesStatus.PENDING : SeriesStatus.COMPLETED,
          winner: teamB ? undefined : teamA,
        };

        if (teamB) {
          seriesPayload.team_b = teamB;
        }

        const series = queryRunner.manager.create(Serie, seriesPayload);
        const savedSeries = await queryRunner.manager.save(Serie, series);
        currentRoundSeries.push(savedSeries);

        if (teamB) {
          for (let j = 1; j <= maxMapsPerSeries; j++) {
            const uniqueCode = riotCodes.shift();
            const match = queryRunner.manager.create(Match, {
              series: savedSeries,
              match_order: j,
              status: MatchStatus.CREATED,
              tournament_code: uniqueCode,
            });
            await queryRunner.manager.save(Match, match);
          }
        }
      }

      while (currentRoundSeries.length > 1) {
        currentRoundOrder++;
        const nextRoundSeries: Serie[] = [];
        const isFinal = Math.ceil(currentRoundSeries.length / 2) === 1;
        const stageName = isFinal ? 'Gran Final' : `Ronda ${currentRoundOrder}`;

        for (let i = 0; i < currentRoundSeries.length; i += 2) {
          const parentSeries = queryRunner.manager.create(Serie, {
            tournament,
            wins_required: winsRequired,
            team_a_wins: 0,
            team_b_wins: 0,
            round_order: currentRoundOrder,
            stage_name: stageName,
            status: SeriesStatus.PENDING,
          });

          const savedParentSeries = await queryRunner.manager.save(
            Serie,
            parentSeries,
          );
          nextRoundSeries.push(savedParentSeries);

          const childSeriesA = currentRoundSeries[i];
          childSeriesA.next_series = savedParentSeries;
          childSeriesA.next_series_slot = SeriesSlot.TEAM_A;
          await queryRunner.manager.save(Serie, childSeriesA);

          if (currentRoundSeries[i + 1]) {
            const childSeriesB = currentRoundSeries[i + 1];
            childSeriesB.next_series = savedParentSeries;
            childSeriesB.next_series_slot = SeriesSlot.TEAM_B;
            await queryRunner.manager.save(Serie, childSeriesB);
          }

          for (let j = 1; j <= maxMapsPerSeries; j++) {
            const uniqueCode = riotCodes.shift();
            const match = queryRunner.manager.create(Match, {
              series: savedParentSeries,
              match_order: j,
              status: MatchStatus.CREATED,
              tournament_code: uniqueCode,
            });
            await queryRunner.manager.save(Match, match);
          }
        }

        currentRoundSeries = nextRoundSeries;
      }

      tournament.status = TournamentStatus.STARTED;
      const updatedTournament = await queryRunner.manager.save(
        Tournament,
        tournament,
      );

      await queryRunner.commitTransaction();
      return updatedTournament;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
