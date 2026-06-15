import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import { Serie, SeriesStatus } from '../series/entities/series.entity';
import { Team } from '../teams/entities/team.entity';
import { WebhookRiotDto } from './dto/update-match-webhook.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
  ) {}

  async processRiotWebhook(
    data: WebhookRiotDto,
  ): Promise<Match | { message: string }> {
    const matchId = data.metaData; // Extraemos el UUID validado

    // 1. Buscamos el partido trayendo la serie y a los JUGADORES de cada equipo
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
      throw new NotFoundException(
        'El mapa especificado en la metadata no existe.',
      );
    }

    if (match.status === MatchStatus.FINISHED) {
      return { message: 'Este mapa ya fue procesado.' };
    }

    // 2. DEDUCIR EL EQUIPO GANADOR
    // Tomamos un jugador de los que Riot nos dice que ganaron
    const riotWinnerName = data.winningTeam[0].summonerName.toLowerCase();

    let winnerTeamId: string | null = null;
    const series = match.series;

    // Buscamos si ese jugador está en el roster del team_a
    const isTeamAWinner = series.team_a?.members.some(
      (m) => m.riotGameName?.toLowerCase() === riotWinnerName, // Ajustá 'riot_summoner_name' al campo real de tu UserEntity
    );

    if (isTeamAWinner && series.team_a) {
      winnerTeamId = series.team_a.id;
      series.team_a_wins += 1;
    } else if (series.team_b) {
      winnerTeamId = series.team_b.id;
      series.team_b_wins += 1;
    }

    // 3. Actualizamos el mapa individual con los datos reales de Riot
    match.status = MatchStatus.FINISHED;
    match.riot_match_id = data.gameId.toString();
    match.start_date = new Date(data.startTime);
    match.end_date = new Date(); // El momento exacto en que llega el webhook
    match.winner = { id: winnerTeamId } as Team;

    // Guardamos el JSON crudo por si queremos sacar KDA o oro después
    match.stats = { winningTeamInfo: data.winningTeam };

    await this.matchRepository.save(match);

    // 4. Chequeamos si la serie llegó a su fin (BO3, BO5, etc.)
    let isSeriesFinished = false;

    if (series.team_a_wins >= series.wins_required) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_a;
      isSeriesFinished = true;
    } else if (series.team_b_wins >= series.wins_required) {
      series.status = SeriesStatus.COMPLETED;
      series.winner = series.team_b;
      isSeriesFinished = true;
    }

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
