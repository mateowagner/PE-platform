// pe-api/src/standings/standings.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Standing } from './entities/standing.entity';
import { Serie, SeriesStatus } from '../series/entities/series.entity';

@Injectable()
export class StandingsService {
  constructor(
    @InjectRepository(Standing)
    private readonly standingRepository: Repository<Standing>,
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
  ) {}

  async getTournamentStandings(tournamentId: string): Promise<Standing[]> {
    // 1. Cargar standings filtrando por queryBuilder o declarando relaciones explícitas
    const standings = await this.standingRepository
      .createQueryBuilder('standing')
      .leftJoinAndSelect('standing.team', 'team')
      .where('standing.tournament_id = :tournamentId', { tournamentId })
      .getMany();

    if (!standings || standings.length === 0) {
      throw new NotFoundException(
        'No hay tabla de posiciones registrada para este torneo.',
      );
    }

    // 2. Cargar series completadas para resolver Head-to-Head
    const completedSeries = await this.seriesRepository
      .createQueryBuilder('serie')
      .leftJoinAndSelect('serie.team_a', 'team_a')
      .leftJoinAndSelect('serie.team_b', 'team_b')
      .leftJoinAndSelect('serie.winner', 'winner')
      .where('serie.tournament_id = :tournamentId', { tournamentId })
      .andWhere('serie.status = :status', { status: SeriesStatus.COMPLETED })
      .getMany();

    // 3. Criterios oficiales de desempate LPE
    return standings.sort((a, b) => {
      // 1. Puntos de serie (1 pt por victoria Bo3)
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      // 2. Menor cantidad de mapas perdidos (Diferencial)
      if (a.matches_lost !== b.matches_lost) {
        return a.matches_lost - b.matches_lost;
      }

      // 3. Head-to-Head (Enfrentamiento particular directo)
      const directSeries = completedSeries.find(
        (s) =>
          (s.team_a?.id === a.team.id && s.team_b?.id === b.team.id) ||
          (s.team_a?.id === b.team.id && s.team_b?.id === a.team.id),
      );

      if (directSeries && directSeries.winner) {
        if (directSeries.winner.id === a.team.id) return -1;
        if (directSeries.winner.id === b.team.id) return 1;
      }

      // 4. Fallback: Mayor cantidad de mapas ganados
      return b.matches_won - a.matches_won;
    });
  }
}
