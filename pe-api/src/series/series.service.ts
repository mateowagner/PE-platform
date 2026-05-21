import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentSeries } from './entities/series.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { CreateSeriesDto } from './dto/create-series.dto';
@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(TournamentSeries)
    private readonly seriesRepository: Repository<TournamentSeries>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  async create(createSeriesDto: CreateSeriesDto): Promise<TournamentSeries> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: createSeriesDto.tournament_id },
    });

    if (!tournament) {
      throw new NotFoundException('El torneo especificado no existe.');
    }

    const newSeries = this.seriesRepository.create({
      ...createSeriesDto,
      tournament,
    });

    return await this.seriesRepository.save(newSeries);
  }

  async findAll(): Promise<TournamentSeries[]> {
    return await this.seriesRepository.find({
      relations: ['tournament', 'team_a', 'team_b', 'winner'],
    });
  }

  async findOne(id: string): Promise<TournamentSeries> {
    const series = await this.seriesRepository.findOne({
      where: { id },
      relations: ['tournament', 'team_a', 'team_b', 'winner'],
    });

    if (!series) {
      throw new NotFoundException(`La serie con ID ${id} no existe.`);
    }

    return series;
  }

  async update(
    id: string,
    updateData: Partial<TournamentSeries>,
  ): Promise<TournamentSeries> {
    const series = await this.findOne(id);
    Object.assign(series, updateData);
    return await this.seriesRepository.save(series);
  }

  async remove(id: string): Promise<void> {
    const series = await this.findOne(id);
    await this.seriesRepository.remove(series);
  }
}
