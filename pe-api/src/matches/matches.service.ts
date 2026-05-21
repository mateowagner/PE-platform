import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import {
  TournamentSeries,
  SeriesStatus,
} from '../series/entities/series.entity';
import { Team } from '../teams/entities/team.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(TournamentSeries)
    private readonly seriesRepository: Repository<TournamentSeries>,
  ) {}

  async reportMatchResult(
    matchId: string,
    riotMatchId: string,
    winnerTeamId: string,
    stats: Record<string, any>,
  ): Promise<Match | { message: string }> {
    // 1. Buscamos el partido trayendo la serie padre y los equipos involucrados
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['series', 'series.team_a', 'series.team_b'],
    });

    if (!match) {
      throw new NotFoundException('El mapa especificado no existe.');
    }

    // --- PROTECCIÓN CONTRA DOBLE WEBHOOK ---
    if (match.status === MatchStatus.FINISHED) {
      // Devolvemos un 200 silencioso para que el webhook no siga insistiendo
      return { message: 'Este mapa ya fue procesado y cerrado previamente.' };
    }

    // 2. Actualizamos el mapa individual
    match.status = MatchStatus.FINISHED;
    match.riot_match_id = riotMatchId;
    match.stats = stats;
    match.winner = { id: winnerTeamId } as Team;

    await this.matchRepository.save(match);

    // 3. Actualizamos los contadores de la Serie
    const series = match.series;
    let isSeriesFinished = false;

    // Verificamos quién ganó y sumamos el punto
    if (series.team_a && series.team_a.id === winnerTeamId) {
      series.team_a_wins += 1;
    } else if (series.team_b && series.team_b.id === winnerTeamId) {
      series.team_b_wins += 1;
    } else {
      throw new BadRequestException(
        'El equipo ganador no pertenece a esta serie.',
      );
    }

    // 4. Chequeamos si la serie llegó a su fin (BO3, BO5, etc.)
    if (series.team_a_wins >= series.wins_required) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_a;
      isSeriesFinished = true;
    } else if (series.team_b_wins >= series.wins_required) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_b;
      isSeriesFinished = true;
    }

    // Guardamos los cambios en la serie
    await this.seriesRepository.save(series);

    // 5. Limpieza de base de datos (Mapas Fantasmas)
    if (isSeriesFinished) {
      await this.matchRepository.update(
        {
          series: { id: series.id },
          status: MatchStatus.CREATED,
        },
        {
          status: MatchStatus.FINISHED,
        },
      );
    }

    return match;
  }

  async create(seriesId: string, matchOrder: number): Promise<Match> {
    // Validamos que la serie padre exista
    const series = await this.seriesRepository.findOne({
      where: { id: seriesId },
    });

    if (!series) {
      throw new NotFoundException('La serie especificada no existe.');
    }

    // Creamos el cascarón vacío del mapa
    const newMatch = this.matchRepository.create({
      match_order: matchOrder,
      status: MatchStatus.CREATED,
      series: series,
    });

    return await this.matchRepository.save(newMatch);
  }

  async findAll(): Promise<Match[]> {
    // Traemos todos los mapas con sus relaciones básicas
    return await this.matchRepository.find({
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
    const match = await this.findOne(id); // Reutilizamos el findOne para validar que exista

    // Mezclamos los datos nuevos con los existentes
    Object.assign(match, updateData);

    return await this.matchRepository.save(match);
  }

  async remove(id: string): Promise<void> {
    const match = await this.findOne(id);

    // Al usar TypeORM, si la relación en la entidad tiene onDelete: 'CASCADE',
    // borrar la serie borraría estos matches. Pero acá lo borramos individualmente.
    await this.matchRepository.remove(match);
  }
}
