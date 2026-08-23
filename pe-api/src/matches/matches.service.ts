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
} from '../tournaments/entities/tournament.entity'; // <-- Importar Tournament y TournamentStatus
@Injectable()
export class MatchesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
  ) {}

  async processRiotWebhook(
    data: WebhookRiotDto,
  ): Promise<Match | { message: string }> {
    const matchId = data.metaData;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo pesimista exclusivo sobre la fila de matches sin JOINs
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

      // 2. Cargar relaciones sin lock
      const match = await queryRunner.manager.findOne(Match, {
        where: { id: matchId },
        relations: [
          'series',
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

      // 3. Deducir Equipo Ganador con trim y lowerCase
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

      // 4. Actualizar estado del Match
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
      // 1. Bloqueo sin joins
      const matchLock = await queryRunner.manager
        .createQueryBuilder(Match, 'match')
        .setLock('pessimistic_write')
        .where('match.id = :matchId', { matchId })
        .getOne();

      if (!matchLock)
        throw new NotFoundException('El mapa especificado no existe.');

      // 2. Carga de relaciones sin lock
      const match = await queryRunner.manager.findOne(Match, {
        where: { id: matchId },
        relations: [
          'series',
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

    if (series.team_a_wins >= series.wins_required && series.team_a) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_a;
      seriesWinner = series.team_a;
    } else if (series.team_b_wins >= series.wins_required && series.team_b) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_b;
      seriesWinner = series.team_b;
    } else {
      series.status = SeriesStatus.IN_PROGRESS;
    }

    await queryRunner.manager.save(Serie, series);

    // 1. Caso A: Propagación hacia la siguiente serie (Rondas intermedias)
    if (seriesWinner && series.next_series) {
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

    // 2. Caso B: Gran Final completada -> Finalizar el Torneo y coronar campeón
    if (seriesWinner && !series.next_series) {
      // Obtenemos el ID del torneo desde la relación o la FK
      const seriesWithTournament = await queryRunner.manager.findOne(Serie, {
        where: { id: series.id },
        relations: ['tournament'],
      });

      const tournamentId = seriesWithTournament?.tournament?.id;

      if (tournamentId) {
        const tournamentLock = await queryRunner.manager
          .createQueryBuilder(Tournament, 'tournament')
          .setLock('pessimistic_write')
          .where('tournament.id = :tournamentId', { tournamentId })
          .getOne();

        if (tournamentLock) {
          tournamentLock.status = TournamentStatus.FINISHED;
          tournamentLock.winner = seriesWinner;
          await queryRunner.manager.save(Tournament, tournamentLock);
        }
      }
    }

    // 3. Cancelar mapas restantes que ya no son necesarios en el Bo3
    if (seriesWinner) {
      await queryRunner.manager
        .createQueryBuilder()
        .update(Match)
        .set({ status: MatchStatus.FINISHED })
        .where('series_id = :seriesId', { seriesId: series.id })
        .andWhere('status = :status', { status: MatchStatus.CREATED })
        .execute();
    }
  }

  async create(seriesId: string, matchOrder: number): Promise<Match> {
    const series = await this.seriesRepository.findOne({
      where: { id: seriesId },
    });

    if (!series)
      throw new NotFoundException('La serie especificada no existe.');

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
}
