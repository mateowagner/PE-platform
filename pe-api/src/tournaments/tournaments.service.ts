import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import {
  Tournament,
  TournamentStatus,
  TournamentType,
} from './entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import {
  TournamentSeries,
  SeriesStatus,
  SeriesSlot,
} from '../series/entities/series.entity'; // Ajustá el path según tu proyecto
@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly dataSource: DataSource,
  ) {}
  async getTournamentDetails(id: string): Promise<unknown> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['teams', 'teams.members'],
    });

    if (!tournament) {
      throw new NotFoundException('El torneo no existe.');
    }

    // Calculamos métricas extras para el frontend de forma limpia
    const participantsData = tournament.teams.map((team) => {
      // Cálculo del Tier promedio del equipo basado en sus miembros
      const totalPoints = team.members.reduce((acc, member) => {
        // Mapeo simple de puntos por liga para promediar (adaptalo a tus puntos de rango si difiere)
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

  // --- INSCRIBIR EQUIPO (TRANSACCIONAL CON LOCK) ---
  async inscribeTeam(
    tournamentId: string,
    userId: string,
    teamId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueamos la fila del torneo para evitar condiciones de carrera en los cupos
      const tournament = await queryRunner.manager.findOne(Tournament, {
        where: { id: tournamentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!tournament) {
        throw new NotFoundException('El torneo no existe.');
      }
      tournament.teams = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .innerJoin('team.tournaments', 'tournament', 'tournament.id = :id', {
          id: tournamentId,
        })
        .getMany();

      // 2. Validaciones de Estado y Fechas del Torneo
      if (tournament.status !== TournamentStatus.PREPARING) {
        throw new BadRequestException(
          'Las inscripciones para este torneo ya no están abiertas.',
        );
      }

      const now = new Date();
      if (
        now < tournament.registration_start_date ||
        now > tournament.registration_end_date
      ) {
        throw new ConflictException(
          'La fecha de inscripción expiró o aún no ha comenzado.',
        );
      }

      if (tournament.teams.length >= tournament.max_teams) {
        throw new ConflictException(
          'El torneo ya alcanzó el cupo máximo de equipos.',
        );
      }

      // 3. Validaciones estructurales del Equipo postulante
      const team = await queryRunner.manager.findOne(Team, {
        where: { id: teamId },
        relations: ['owner', 'members'],
      });

      if (!team) {
        throw new NotFoundException('El equipo especificado no existe.');
      }

      if (team.owner.id !== userId) {
        throw new BadRequestException(
          'Solo el capitán del equipo puede realizar la inscripción.',
        );
      }

      if (team.members.length < 0 || team.members.length > 7) {
        throw new BadRequestException(
          'El equipo debe tener entre 5 y 7 jugadores activos para inscribirse.',
        );
      }

      if (tournament.teams.some((t) => t.id === team.id)) {
        throw new ConflictException(
          'Tu equipo ya se encuentra inscripto en este torneo.',
        );
      }

      // 4. Ejecutar la mutación (Insertar en la tabla intermedia de la relación ManyToMany)
      tournament.teams.push(team);
      await queryRunner.manager.save(Tournament, tournament);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // --- DAR DE BAJA EQUIPO ---
  async cancelInscription(
    tournamentId: string,
    userId: string,
    teamId: string,
  ): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['teams'],
    });

    if (!tournament) {
      throw new NotFoundException('El torneo no existe.');
    }

    if (tournament.status !== TournamentStatus.PREPARING) {
      throw new BadRequestException(
        'No podés darte de baja. El torneo ya arrancó o finalizó.',
      );
    }

    const teamIndex = tournament.teams.findIndex((t) => t.id === teamId);
    if (teamIndex === -1) {
      throw new BadRequestException(
        'Este equipo no está registrado en el torneo.',
      );
    }

    // Buscamos el equipo de forma aislada para validar autoría de capitanía
    const team = await this.dataSource.getRepository(Team).findOne({
      where: { id: teamId },
      relations: ['owner'],
    });

    if (!team || team.owner.id !== userId) {
      throw new BadRequestException(
        'Solo el capitán puede dar de baja al equipo del torneo.',
      );
    }

    // Removemos de la relación intermedia y guardamos
    tournament.teams.splice(teamIndex, 1);
    await this.tournamentRepository.save(tournament);
  }
  async create(
    createTournamentDto: CreateTournamentDto,
    creatorId: string,
  ): Promise<Tournament> {
    const { registration_start_date, registration_end_date, start_date } =
      createTournamentDto;

    const regStart = new Date(registration_start_date);
    const regEnd = new Date(registration_end_date);
    const tournamentStart = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizamos las horas para comparar solo días

    // VALIDACIÓN 1: La inscripción no puede abrir en el pasado
    if (regStart < today) {
      throw new BadRequestException(
        'La fecha de inicio de inscripción no puede estar en el pasado.',
      );
    }

    // VALIDACIÓN 2: El cierre de inscripción debe ser posterior a la apertura
    if (regEnd <= regStart) {
      throw new BadRequestException(
        'La fecha de finalización de inscripción debe ser posterior a la fecha de inicio.',
      );
    }

    // VALIDACIÓN 3: El torneo debe empezar estrictamente después de cerrar las inscripciones
    if (tournamentStart <= regEnd) {
      throw new BadRequestException(
        'La fecha de inicio del torneo debe ser posterior al cierre de las inscripciones.',
      );
    }

    // Creación de la instancia sobreescribiendo los valores controlados por el sistema
    const newTournament = this.tournamentRepository.create({
      ...createTournamentDto,
      status: TournamentStatus.PREPARING,
      current_stage: 'PRE-TORNEO',
      created_by: { id: creatorId } as DeepPartial<User>, // Asignamos la relación usando solo el ID
    });

    return await this.tournamentRepository.save(newTournament);
  }
  async findAll(): Promise<Tournament[]> {
    return await this.tournamentRepository.find({
      relations: ['teams'], // ➔ CRÍTICO: Si no ponés esto, 'teams' viene undefined y el front lee 0 cupos.
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
    updateData: Partial<Tournament>,
  ): Promise<Tournament> {
    const tournament = await this.findOne(id);
    Object.assign(tournament, updateData);
    return await this.tournamentRepository.save(tournament);
  }

  async remove(id: string): Promise<void> {
    const tournament = await this.findOne(id);
    await this.tournamentRepository.remove(tournament);
  }
  async getTournamentSeries(tournamentId: string): Promise<TournamentSeries[]> {
    return await this.dataSource.getRepository(TournamentSeries).find({
      where: { tournament: { id: tournamentId } },
      relations: ['team_a', 'team_b', 'winner'],
      // FIX 1: Quitamos createdAt ya que no está tipado en el FindOptionsOrder de esta entidad
      order: { round_order: 'ASC' },
    });
  }

  async generateFixture(tournamentId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tournament = await queryRunner.manager.findOne(Tournament, {
        where: { id: tournamentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!tournament) {
        throw new NotFoundException('El torneo no existe.');
      }

      if (tournament.status !== TournamentStatus.PREPARING) {
        throw new BadRequestException('El fixture ya fue generado.');
      }

      const teams = await queryRunner.manager
        .createQueryBuilder(Team, 'team')
        .innerJoin('team.tournaments', 'tournament', 'tournament.id = :id', {
          id: tournamentId,
        })
        .getMany();

      if (teams.length < 2) {
        throw new BadRequestException(
          'Se necesitan al menos 2 equipos para generar el fixture.',
        );
      }

      // ==========================================================================
      // ALGORITMO LIGA (ROUND ROBIN)
      // ==========================================================================
      if (tournament.type === TournamentType.LEAGUE) {
        const list = [...teams];
        // FIX 3: Cambiamos 'null as any' por 'null as unknown as Team' para pasar el control de ESLint
        if (list.length % 2 !== 0) list.push(null as unknown as Team);

        const numTeams = list.length;
        const numRounds = numTeams - 1;
        const matchesPerRound = numTeams / 2;

        for (let round = 0; round < numRounds; round++) {
          const stageName = `Fecha ${round + 1}`;

          for (let match = 0; match < matchesPerRound; match++) {
            const home = (round + match) % (numTeams - 1);
            const away = (numTeams - 1 - match + round) % (numTeams - 1);

            const teamA = match === 0 ? list[numTeams - 1] : list[home];
            const teamB = list[away];

            if (teamA === null || teamB === null) continue; // Descansa por impar

            const series = queryRunner.manager.create(TournamentSeries, {
              tournament,
              stage_name: stageName,
              round_order: round + 1,
              team_a: teamA,
              team_b: teamB,
              status: SeriesStatus.PENDING,
              wins_required: 2,
            });
            await queryRunner.manager.save(TournamentSeries, series);
          }
        }
        tournament.current_stage = 'Fecha 1';
      }

      // ==========================================================================
      // ALGORITMO COPA (ÁRBOL BINARIO ENLAZADO DESDE LA FINAL)
      // ==========================================================================
      else if (tournament.type === TournamentType.CUP) {
        const shuffledTeams = teams.sort(() => Math.random() - 0.5);
        const totalTeams = shuffledTeams.length;

        let exponent = Math.ceil(Math.log2(totalTeams));
        if (exponent < 1) exponent = 1;

        // Estructura para agrupar todas las rondas que vamos a crear
        const allRoundsSeries: TournamentSeries[][] = [];

        // 1. CREAMOS EL ÁRBOL DE FORMA CRECIENTE (Ronda 1 a Exponente)
        for (let r = 1; r <= exponent; r++) {
          // r = 1 tiene la mayor cantidad de partidos. Cada ronda superior tiene la mitad.
          const roundsCount = Math.pow(2, exponent - r);

          let stageName = 'Final';
          if (roundsCount === 2) stageName = 'Semifinal';
          else if (roundsCount === 4) stageName = 'Cuartos de Final';
          else if (roundsCount === 8) stageName = 'Octavos de Final';
          else if (roundsCount > 8) stageName = `Ronda de ${roundsCount * 2}`;

          const currentRoundSeries: TournamentSeries[] = [];

          for (let s = 0; s < roundsCount; s++) {
            const series = queryRunner.manager.create(TournamentSeries, {
              tournament,
              stage_name: stageName,
              round_order: r,
              status: SeriesStatus.PENDING,
              wins_required: 2,
            });

            const savedSeries = await queryRunner.manager.save(
              TournamentSeries,
              series,
            );
            currentRoundSeries.push(savedSeries);
          }

          allRoundsSeries.push(currentRoundSeries);
        }

        // 2. ENLAZAMOS LAS RONDAS ENTRE SÍ (Conectamos los punteros de los hijos con sus padres)
        for (let r = 0; r < exponent - 1; r++) {
          const currentRound = allRoundsSeries[r];
          const nextRound = allRoundsSeries[r + 1];

          for (let s = 0; s < currentRound.length; s++) {
            const parentIndex = Math.floor(s / 2);
            currentRound[s].next_series = nextRound[parentIndex];
            currentRound[s].next_series_slot =
              s % 2 === 0 ? SeriesSlot.TEAM_A : SeriesSlot.TEAM_B;

            await queryRunner.manager.save(TournamentSeries, currentRound[s]);
          }
        }

        // 3. POBLAMOS LA RONDA 1 (allRoundsSeries[0]) CON LOS EQUIPOS REALES
        const firstRoundSeries = allRoundsSeries[0];
        let teamIndex = 0;

        for (const match of firstRoundSeries) {
          if (teamIndex < totalTeams) {
            match.team_a = shuffledTeams[teamIndex++];
          }
          if (teamIndex < totalTeams) {
            match.team_b = shuffledTeams[teamIndex++];
          }

          // Caso de BYE (Rival nulo, pasa directo)
          if (match.team_a && !match.team_b) {
            match.winner = match.team_a;
            match.status = SeriesStatus.COMPLETED;
            match.team_a_wins = match.wins_required;

            if (match.next_series && match.next_series_slot) {
              const parent = match.next_series;
              if (match.next_series_slot === SeriesSlot.TEAM_A) {
                parent.team_a = match.team_a;
              } else {
                parent.team_b = match.team_a;
              }
              await queryRunner.manager.save(TournamentSeries, parent);
            }
          }
          await queryRunner.manager.save(TournamentSeries, match);
        }

        tournament.current_stage =
          firstRoundSeries[0]?.stage_name || 'Fase Inicial';
      }

      tournament.status = TournamentStatus.STARTED;
      await queryRunner.manager.save(Tournament, tournament);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Ajustamos las llaves para que el bloque finally quede bien formateado
      await queryRunner.release();
    }
  }
}
