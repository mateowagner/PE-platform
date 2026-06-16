import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Tournament, TournamentStatus } from './entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { Serie, SeriesStatus } from '../series/entities/series.entity'; // Ajustá el path según tu proyecto
import { RiotService } from '../riot/riot.service';
import { Match, MatchStatus } from '../matches/entities/match.entity';
@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly dataSource: DataSource,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,

    // ➔ AGREGAR ESTA LÍNEA:
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

    // 1. OBTENEMOS EL PROVIDER GLOBAL (Si no está en el .env, el servicio lo registra en Riot)
    // Reemplaza esta URL con la real donde vas a recibir los Webhooks de resultados de Riot
    const webhookUrl = 'https://tu-dominio-publico.com/api/v1/matches/webhook';
    const providerId = await this.riotService.getOrCreateProviderId(webhookUrl);

    // 2. REGISTRAMOS EL TORNEO EN RIOT GAMES USANDO ESE PROVIDER
    const riotTournamentId = await this.riotService.registerTournament(
      providerId,
      name,
    );

    // 3. PERSISTIMOS EL TORNEO LOCALMENTE YA CON SU ID DE RIOT INYECTADO
    const newTournament = this.tournamentRepository.create({
      ...createTournamentDto,
      status: TournamentStatus.PREPARING,
      current_stage: 'PRE-TORNEO',
      riot_tournament_id: String(riotTournamentId), // ➔ CRÍTICO: Guardamos la llave de Riot
      created_by: { id: creatorId } as DeepPartial<User>,
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
  async getTournamentSeries(tournamentId: string): Promise<Serie[]> {
    return await this.dataSource.getRepository(Serie).find({
      where: { tournament: { id: tournamentId } },
      relations: ['team_a', 'team_b', 'winner'],
      // FIX 1: Quitamos createdAt ya que no está tipado en el FindOptionsOrder de esta entidad
      order: { round_order: 'ASC' },
    });
  }

  async generateFixture(tournamentId: string): Promise<Tournament> {
    // 1. Validar el torneo y sus configuraciones de Riot
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['teams'], // Traemos los equipos inscritos
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

    // 2. CALCULAR EL TOTAL DE MAPAS (MATCHES) MÁXIMOS NECESARIOS
    // Para eliminación directa: N equipos requieren (N - 1) enfrentamientos globales (series).
    // Si cada serie es al Mejor de 3 (BO3), el máximo de mapas por serie es 3.
    const winsRequired = 2; // BO3 (gana el primero que llega a 2)
    const maxMapsPerSeries = winsRequired * 2 - 1; // 3 mapas
    const totalSeries = teams.length - 1;
    const totalMatchesNeeded = totalSeries * maxMapsPerSeries;

    // 3. PEDIR EL LOTE MASIVO DE CÓDIGOS A RIOT GAMES
    // Hacemos una única llamada asíncrona para traer todos los códigos que usará el torneo
    const riotCodes = await this.riotService.generateTournamentCodes(
      Number(tournament.riot_tournament_id),
      totalMatchesNeeded,
      tournament.map_type,
      tournament.pick_type,
    );

    // 4. CREAR LAS LLAVES DE LA PRIMERA RONDA (Equipos Reales)
    let currentRoundSeries: Serie[] = [];
    let currentRoundOrder = 1;

    for (let i = 0; i < teams.length; i += 2) {
      const teamA = teams[i];
      const teamB = teams[i + 1] ?? null;

      const series = this.seriesRepository.create({
        tournament,
        team_a: teamA,
        team_b: teamB,
        wins_required: winsRequired,
        team_a_wins: 0,
        team_b_wins: 0,
        round_order: currentRoundOrder,
        stage_name: 'Ronda 1', // Nombraremos mejor esto en la Fase 2
        status: SeriesStatus.PENDING,
      });

      const savedSeries = await this.seriesRepository.save(series);
      currentRoundSeries.push(savedSeries);

      // Lógica de repartición de mapas (Matches)
      if (teamB) {
        for (let j = 1; j <= maxMapsPerSeries; j++) {
          const uniqueCode = riotCodes.shift();
          const match = this.matchRepository.create({
            series: savedSeries,
            match_order: j,
            status: MatchStatus.CREATED,
            tournament_code: uniqueCode,
          });
          await this.matchRepository.save(match);
        }
      } else {
        // Si no hay rival (BYE), avanza directo
        savedSeries.status = SeriesStatus.COMPLETED;
        savedSeries.winner = teamA;
        await this.seriesRepository.save(savedSeries);
      }
    }

    // 5. CONSTRUIR EL RESTO DEL ÁRBOL HASTA LA FINAL (Equipos 'Por Definir')
    while (currentRoundSeries.length > 1) {
      currentRoundOrder++;
      const nextRoundSeries: Serie[] = [];

      for (let i = 0; i < currentRoundSeries.length; i += 2) {
        const isFinal = currentRoundSeries.length <= 2;
        const stageName = isFinal ? 'Gran Final' : `Ronda ${currentRoundOrder}`;

        // ➔ CORRECCIÓN: Omitimos team_a y team_b en lugar de pasarles 'null'
        // para que DeepPartial de TypeORM infiera el objeto correctamente.
        const newSeries = this.seriesRepository.create({
          tournament,
          wins_required: winsRequired,
          team_a_wins: 0,
          team_b_wins: 0,
          round_order: currentRoundOrder,
          stage_name: stageName,
          status: SeriesStatus.PENDING,
        });

        const savedNewSeries = await this.seriesRepository.save(newSeries);

        nextRoundSeries.push(savedNewSeries);

        // Generar mapas vacíos con códigos de Riot para esta llave futura
        for (let j = 1; j <= maxMapsPerSeries; j++) {
          const uniqueCode = riotCodes.shift();
          const match = this.matchRepository.create({
            series: savedNewSeries,
            match_order: j,
            status: MatchStatus.CREATED,
            tournament_code: uniqueCode,
          });
          await this.matchRepository.save(match);
        }
      }

      currentRoundSeries = nextRoundSeries; // Subimos un nivel en el árbol
    }

    // 6. ACTIVAR EL TORNEO
    tournament.status = TournamentStatus.STARTED;
    return await this.tournamentRepository.save(tournament);
  }
}
