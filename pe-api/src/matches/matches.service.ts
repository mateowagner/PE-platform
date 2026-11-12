// pe-api/src/matches/matches.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import {
  Serie,
  SeriesSlot,
  SeriesStatus,
} from '../series/entities/series.entity';
import { Team } from '../teams/entities/team.entity';
import { WebhookRiotDto } from './dto/update-match-webhook.dto';
import {
  Tournament,
  TournamentStatus,
  TournamentType,
} from '../tournaments/entities/tournament.entity';
import { Standing } from '../standings/entities/standing.entity';
import {
  RostersService,
  ParticipantWebhookData,
} from '../rosters/rosters.service';
import { RiotService, RiotMatchParticipant } from '../riot/riot.service';
import { MatchRoster } from '../rosters/entities/match-roster.entity';
@Injectable()
export class MatchesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
    private readonly rostersService: RostersService,
    private readonly riotService: RiotService,
    @InjectRepository(MatchRoster)
    private readonly matchRosterRepository: Repository<MatchRoster>,
  ) {}

  // ─── Control de Salas Personalizadas ─────────────────────────────────────

  async setLobbyCredentials(
    matchId: string,
    lobbyName?: string,
    lobbyPassword?: string,
  ): Promise<Match> {
    const match = await this.findOne(matchId);

    const generatedPass =
      lobbyPassword ?? Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedName =
      lobbyName ?? `LPE-M${match.match_order}-${match.id.substring(0, 8)}`;

    match.lobby_name = generatedName;
    match.lobby_password = generatedPass;

    return await this.matchRepository.save(match);
  }

  async startMatch(matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: [
        'series',
        'series.team_a',
        'series.team_a.members',
        'series.team_b',
        'series.team_b.members',
      ],
    });

    if (!match) {
      throw new NotFoundException('El mapa especificado no existe.');
    }

    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException(
        'No se puede iniciar un mapa ya finalizado.',
      );
    }

    // ── FALLBACK AUTOMÁTICO DE ROSTER ──────────────────────────────────────────
    // 1. Revisar si ya existen rosters cargados previamente para este match
    const existingRostersCount = await this.matchRosterRepository.count({
      where: { match: { id: matchId } },
    });

    // 2. Si no hay lineup declarado, poblar automáticamente con los 5 titulares
    if (existingRostersCount === 0 && match.series) {
      const rostersToInsert: Partial<MatchRoster>[] = [];

      const teams = [match.series.team_a, match.series.team_b].filter(
        (t): t is Team => Boolean(t),
      );

      for (const team of teams) {
        // Tomamos los primeros 5 integrantes con PUUID válido
        const starterMembers = (team.members || [])
          .filter(
            (m) => typeof m.riotPuuid === 'string' && m.riotPuuid.length > 0,
          )
          .slice(0, 5);

        for (const member of starterMembers) {
          rostersToInsert.push({
            match: match,
            team: team,
            user: member,
            riot_puuid: member.riotPuuid,
            is_authorized: true,
          });
        }
      }

      if (rostersToInsert.length > 0) {
        await this.matchRosterRepository.save(rostersToInsert);
      }
    }
    // ───────────────────────────────────────────────────────────────────────────

    match.status = MatchStatus.STARTED;
    match.start_date = new Date();

    return this.matchRepository.save(match);
  }

  // ─── Cierre Manual por ID de Partida (MATCH-V5) ──────────────────────────

  async completeMatchByRiotId(
    matchId: string,
    rawRiotMatchId: string,
  ): Promise<Match> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const matchLock = await queryRunner.manager
        .createQueryBuilder(Match, 'match')
        .setLock('pessimistic_write')
        .where('match.id = :matchId', { matchId })
        .getOne();

      if (!matchLock) {
        throw new NotFoundException('El mapa especificado no existe.');
      }

      if (matchLock.status === MatchStatus.FINISHED) {
        throw new BadRequestException('Este mapa ya fue finalizado.');
      }

      const match = await queryRunner.manager.findOne(Match, {
        where: { id: matchId },
        relations: [
          'series',
          'series.tournament',
          'series.team_a',
          'series.team_b',
          'series.next_series',
        ],
      });

      if (!match || !match.series) {
        throw new BadRequestException('El mapa no tiene una serie asignada.');
      }

      const series = match.series;

      // 1. Obtener datos tipados de Riot Games vía MATCH-V5
      const riotData = await this.riotService.getMatchById(rawRiotMatchId);
      const participants = riotData.info.participants;

      // 2. Cargar los jugadores asignados a este mapa en match_rosters
      const declaredRosters = await queryRunner.manager.find(MatchRoster, {
        where: { match: { id: matchId } },
        relations: ['team', 'user'],
      });

      if (!declaredRosters.length) {
        throw new BadRequestException(
          'No hay jugadores declarados en el roster para este mapa.',
        );
      }

      // Obtener los IDs de los equipos directamente de las entidades relacionadas
      const teamAId = series.team_a?.id;
      const teamBId = series.team_b?.id;

      // 3. Agrupar los PUUIDs declarados por cada equipo normalizados
      const teamAPuuids = new Set<string>();
      const teamBPuuids = new Set<string>();

      for (const entry of declaredRosters) {
        const rawPuuid = entry.riot_puuid || entry.user?.riotPuuid;
        if (!rawPuuid) continue;

        const puuid = rawPuuid.trim();
        const rosterTeamId = entry.team?.id;

        if (teamAId && rosterTeamId === teamAId) {
          teamAPuuids.add(puuid);
        } else if (teamBId && rosterTeamId === teamBId) {
          teamBPuuids.add(puuid);
        }
      }

      // 4. Determinar ganador cruzando los participantes reales de Riot con los rosters
      let winnerTeam: Team | null = null;

      for (const p of participants) {
        const pPuuid = (p.puuid || '').trim();

        if (teamAPuuids.has(pPuuid)) {
          winnerTeam = (p.win ? series.team_a : series.team_b) ?? null;
          break;
        }

        if (teamBPuuids.has(pPuuid)) {
          winnerTeam = (p.win ? series.team_b : series.team_a) ?? null;
          break;
        }
      }

      if (!winnerTeam) {
        throw new BadRequestException(
          'No se encontró a ningún jugador del match roster en la partida reportada de Riot Games.',
        );
      }

      // 5. Asignar mapa a la serie
      if (winnerTeam.id === series.team_a?.id) {
        series.team_a_wins += 1;
      } else if (winnerTeam.id === series.team_b?.id) {
        series.team_b_wins += 1;
      }

      // 6. Persistir estadísticas limpias de los participantes
      const cleanParticipantsStats = participants.map(
        (p: RiotMatchParticipant) => ({
          puuid: p.puuid,
          riotIdGameName: p.riotIdGameName,
          riotIdTagline: p.riotIdTagline,
          championName: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          totalDamageDealtToChampions: p.totalDamageDealtToChampions,
          goldEarned: p.goldEarned,
          win: p.win,
          teamId: p.teamId,
          items: [
            p.item0,
            p.item1,
            p.item2,
            p.item3,
            p.item4,
            p.item5,
            p.item6,
          ],
          roleBoundItem: p.roleBoundItem ?? 0,
        }),
      );

      const formattedMatchId = rawRiotMatchId.startsWith('LA2_')
        ? rawRiotMatchId
        : `LA2_${rawRiotMatchId.trim()}`;

      match.status = MatchStatus.FINISHED;
      match.riot_match_id = formattedMatchId;
      match.winner = winnerTeam;
      match.start_date = new Date(riotData.info.gameStartTimestamp);
      match.end_date = new Date(riotData.info.gameEndTimestamp);
      match.stats = {
        gameDuration: riotData.info.gameDuration,
        gameMode: riotData.info.gameMode,
        participants: cleanParticipantsStats,
      };

      await queryRunner.manager.save(Match, match);

      // 7. Ingesta de auditoría de Rosters
      const winningTeamParticipants: ParticipantWebhookData[] = participants
        .filter((p) => p.win)
        .map((p) => ({
          puuid: p.puuid,
          summonerName: p.riotIdGameName ?? p.summonerName ?? 'Invocador',
        }));

      const isWinnerTeamA = winnerTeam.id === series.team_a?.id;
      const participantsA = isWinnerTeamA ? winningTeamParticipants : [];
      const participantsB = !isWinnerTeamA ? winningTeamParticipants : [];

      if (series.team_a && series.team_b) {
        await this.rostersService.recordMatchParticipants(
          match,
          series.team_a,
          series.team_b,
          participantsA,
          participantsB,
          queryRunner.manager,
        );
      }

      // 8. Evaluar conclusión de la serie y propagar en la llave/bracket
      await this.evaluateAndPropagateSeries(queryRunner, series);

      await queryRunner.commitTransaction();
      return match;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Proceso Webhook Original ────────────────────────────────────────────

  async processRiotWebhook(
    data: WebhookRiotDto,
  ): Promise<Match | { message: string }> {
    const matchId = data.metaData;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const matchLock = await queryRunner.manager
        .createQueryBuilder(Match, 'match')
        .setLock('pessimistic_write')
        .where('match.id = :matchId', { matchId })
        .getOne();

      if (!matchLock) {
        throw new NotFoundException(
          'El mapa especificado en la metadata no existe.',
        );
      }

      if (matchLock.status === MatchStatus.FINISHED) {
        await queryRunner.rollbackTransaction();
        return { message: 'Este mapa ya fue procesado.' };
      }

      const match = await queryRunner.manager.findOne(Match, {
        where: { id: matchId },
        relations: [
          'series',
          'series.tournament',
          'series.team_a',
          'series.team_a.members',
          'series.team_b',
          'series.team_b.members',
          'series.next_series',
        ],
      });

      if (!match || !match.series) {
        throw new BadRequestException(
          'El mapa no tiene una serie asociada válida.',
        );
      }

      const series = match.series;

      const riotWinningMembers = data.winningTeam.map((p) =>
        p.summonerName.toLowerCase().trim(),
      );

      let winnerTeam: Team | null = null;

      const teamAMatches =
        series.team_a?.members.filter((m) => {
          const rName = (m.riotGameName || '').toLowerCase().trim();
          const uName = (m.username || '').toLowerCase().trim();
          return (
            riotWinningMembers.includes(rName) ||
            riotWinningMembers.includes(uName)
          );
        }).length ?? 0;

      const teamBMatches =
        series.team_b?.members.filter((m) => {
          const rName = (m.riotGameName || '').toLowerCase().trim();
          const uName = (m.username || '').toLowerCase().trim();
          return (
            riotWinningMembers.includes(rName) ||
            riotWinningMembers.includes(uName)
          );
        }).length ?? 0;

      if (teamAMatches > teamBMatches && series.team_a) {
        winnerTeam = series.team_a;
        series.team_a_wins += 1;
      } else if (teamBMatches > teamAMatches && series.team_b) {
        winnerTeam = series.team_b;
        series.team_b_wins += 1;
      } else {
        throw new BadRequestException(
          'No se pudo determinar el equipo ganador a partir de las cuentas vinculadas.',
        );
      }

      match.status = MatchStatus.FINISHED;
      match.riot_match_id = data.gameId.toString();
      match.start_date = new Date(data.startTime);
      match.end_date = new Date();
      match.winner = winnerTeam;
      match.stats = {
        winningTeamInfo: data.winningTeam,
        gameName: data.gameName,
        gameType: data.gameType,
        gameMap: data.gameMap,
        gameMode: data.gameMode,
        region: data.region,
      };

      await queryRunner.manager.save(Match, match);

      const winningTeamParticipants: ParticipantWebhookData[] = (
        data.winningTeam || []
      )
        .filter((p) => Boolean(p.puuid))
        .map((p) => ({
          puuid: p.puuid as string,
          summonerName: p.summonerName,
        }));

      const isWinnerTeamA = winnerTeam.id === series.team_a?.id;
      const participantsA = isWinnerTeamA ? winningTeamParticipants : [];
      const participantsB = !isWinnerTeamA ? winningTeamParticipants : [];

      if (series.team_a && series.team_b) {
        await this.rostersService.recordMatchParticipants(
          match,
          series.team_a,
          series.team_b,
          participantsA,
          participantsB,
          queryRunner.manager,
        );
      }

      await this.evaluateAndPropagateSeries(queryRunner, series);

      await queryRunner.commitTransaction();
      return match;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async manualMatchOverride(
    matchId: string,
    winnerTeamId: string,
    notes?: string,
  ): Promise<Match> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const matchLock = await queryRunner.manager
        .createQueryBuilder(Match, 'match')
        .setLock('pessimistic_write')
        .where('match.id = :matchId', { matchId })
        .getOne();

      if (!matchLock) {
        throw new NotFoundException('El mapa especificado no existe.');
      }

      const match = await queryRunner.manager.findOne(Match, {
        where: { id: matchId },
        relations: [
          'series',
          'series.tournament',
          'series.team_a',
          'series.team_b',
          'series.next_series',
        ],
      });

      if (!match || !match.series) {
        throw new BadRequestException('El mapa no tiene una serie asignada.');
      }

      const series = match.series;
      let winnerTeam: Team | null = null;

      if (series.team_a && series.team_a.id === winnerTeamId) {
        winnerTeam = series.team_a;
        series.team_a_wins += 1;
      } else if (series.team_b && series.team_b.id === winnerTeamId) {
        winnerTeam = series.team_b;
        series.team_b_wins += 1;
      } else {
        throw new BadRequestException(
          'El equipo ganador no pertenece a esta serie.',
        );
      }

      match.status = MatchStatus.FINISHED;
      match.winner = winnerTeam;
      match.end_date = new Date();
      match.stats = {
        ...((match.stats as object) || {}),
        is_manual_override: true,
        override_notes: notes ?? 'Resolución administrativa por escritorio.',
      };

      await queryRunner.manager.save(Match, match);
      await this.evaluateAndPropagateSeries(queryRunner, series);

      await queryRunner.commitTransaction();
      return match;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async evaluateAndPropagateSeries(
    queryRunner: QueryRunner,
    series: Serie,
  ): Promise<void> {
    let seriesWinner: Team | null = null;
    let seriesLoser: Team | null = null;

    if (series.team_a_wins >= series.wins_required && series.team_a) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_a;
      seriesWinner = series.team_a;
      seriesLoser = series.team_b ?? null;
    } else if (series.team_b_wins >= series.wins_required && series.team_b) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_b;
      seriesWinner = series.team_b;
      seriesLoser = series.team_a ?? null;
    } else {
      series.status = SeriesStatus.IN_PROGRESS;
    }

    await queryRunner.manager.save(Serie, series);

    if (!seriesWinner) {
      return;
    }

    const seriesWithTournament = await queryRunner.manager.findOne(Serie, {
      where: { id: series.id },
      relations: ['tournament'],
    });
    const tournament = seriesWithTournament?.tournament;

    if (tournament && tournament.type === TournamentType.LEAGUE) {
      await queryRunner.manager
        .createQueryBuilder()
        .update(Standing)
        .set({
          points: () => 'points + 1',
          series_played: () => 'series_played + 1',
          series_won: () => 'series_won + 1',
          matches_won: () =>
            `matches_won + ${Math.max(series.team_a_wins, series.team_b_wins)}`,
          matches_lost: () =>
            `matches_lost + ${Math.min(series.team_a_wins, series.team_b_wins)}`,
        })
        .where('tournament_id = :tId AND team_id = :teamId', {
          tId: tournament.id,
          teamId: seriesWinner.id,
        })
        .execute();

      if (seriesLoser) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Standing)
          .set({
            series_played: () => 'series_played + 1',
            series_lost: () => 'series_lost + 1',
            matches_won: () =>
              `matches_won + ${Math.min(series.team_a_wins, series.team_b_wins)}`,
            matches_lost: () =>
              `matches_lost + ${Math.max(series.team_a_wins, series.team_b_wins)}`,
          })
          .where('tournament_id = :tId AND team_id = :teamId', {
            tId: tournament.id,
            teamId: seriesLoser.id,
          })
          .execute();
      }
    }

    if (series.next_series) {
      const nextSeriesLock = await queryRunner.manager
        .createQueryBuilder(Serie, 'serie')
        .setLock('pessimistic_write')
        .where('serie.id = :seriesId', { seriesId: series.next_series.id })
        .getOne();

      if (nextSeriesLock) {
        if (series.next_series_slot === SeriesSlot.TEAM_A) {
          nextSeriesLock.team_a = seriesWinner;
        } else if (series.next_series_slot === SeriesSlot.TEAM_B) {
          nextSeriesLock.team_b = seriesWinner;
        }
        await queryRunner.manager.save(Serie, nextSeriesLock);
      }
    }

    if (
      !series.next_series &&
      tournament &&
      tournament.type === TournamentType.CUP
    ) {
      const tournamentLock = await queryRunner.manager
        .createQueryBuilder(Tournament, 'tournament')
        .setLock('pessimistic_write')
        .where('tournament.id = :tournamentId', { tournamentId: tournament.id })
        .getOne();

      if (tournamentLock) {
        tournamentLock.status = TournamentStatus.FINISHED;
        tournamentLock.winner = seriesWinner;
        await queryRunner.manager.save(Tournament, tournamentLock);
      }
    }

    await queryRunner.manager
      .createQueryBuilder()
      .update(Match)
      .set({ status: MatchStatus.FINISHED })
      .where('series_id = :seriesId', { seriesId: series.id })
      .andWhere('status = :status', { status: MatchStatus.CREATED })
      .execute();
  }

  async create(seriesId: string, matchOrder: number): Promise<Match> {
    const series = await this.seriesRepository.findOne({
      where: { id: seriesId },
    });

    if (!series) {
      throw new NotFoundException('La serie especificada no existe.');
    }

    const newMatch = this.matchRepository.create({
      match_order: matchOrder,
      status: MatchStatus.CREATED,
      series: series,
    });

    return this.matchRepository.save(newMatch);
  }

  async findAll(): Promise<Match[]> {
    return this.matchRepository.find({
      relations: ['series', 'winner'],
    });
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id },
      relations: ['series', 'winner'],
    });

    if (!match) {
      throw new NotFoundException(`El mapa con ID ${id} no fue encontrado.`);
    }

    return match;
  }

  async update(id: string, updateData: Partial<Match>): Promise<Match> {
    const match = await this.findOne(id);
    Object.assign(match, updateData);
    return this.matchRepository.save(match);
  }

  async remove(id: string): Promise<void> {
    const match = await this.findOne(id);
    await this.matchRepository.remove(match);
  }

  async findMatchesByTeam(
    teamId: string,
    filterStatus?: 'pending' | 'finished',
  ): Promise<Match[]> {
    const query = this.matchRepository
      .createQueryBuilder('match')
      .innerJoinAndSelect('match.series', 'series')
      .leftJoinAndSelect('series.tournament', 'tournament')
      .leftJoinAndSelect('series.team_a', 'team_a')
      .leftJoinAndSelect('series.team_b', 'team_b')
      .leftJoinAndSelect('series.winner', 'series_winner')
      .leftJoinAndSelect('match.winner', 'match_winner')
      .where('(team_a.id = :teamId OR team_b.id = :teamId)', { teamId });

    if (filterStatus === 'pending') {
      query.andWhere('match.status IN (:...statuses)', {
        statuses: [MatchStatus.CREATED, MatchStatus.STARTED],
      });
      query.orderBy('series.scheduled_date', 'ASC', 'NULLS LAST');
      query.addOrderBy('match.match_order', 'ASC');
    } else if (filterStatus === 'finished') {
      query.andWhere('match.status = :status', {
        status: MatchStatus.FINISHED,
      });
      query.orderBy('match.end_date', 'DESC', 'NULLS LAST');
      query.addOrderBy('series.scheduled_date', 'DESC', 'NULLS LAST');
      query.addOrderBy('match.match_order', 'DESC');
    } else {
      query.orderBy('series.scheduled_date', 'DESC', 'NULLS LAST');
      query.addOrderBy('match.match_order', 'ASC');
    }

    return await query.getMany();
  }
}
