// pe-api/src/series/series.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Serie } from './entities/series.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { CreateSeriesDto } from './dto/create-series.dto';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  async create(createSeriesDto: CreateSeriesDto): Promise<Serie> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: createSeriesDto.tournament_id },
    });
    if (!tournament) throw new NotFoundException('El torneo no existe.');

    const newSeries = this.seriesRepository.create({
      ...createSeriesDto,
      tournament,
    });
    return await this.seriesRepository.save(newSeries);
  }

  async findAll(): Promise<Serie[]> {
    return await this.seriesRepository.find({
      relations: ['tournament', 'team_a', 'team_b', 'winner', 'matches'],
    });
  }

  async findOne(id: string): Promise<Serie> {
    const series = await this.seriesRepository.findOne({
      where: { id },
      relations: ['tournament', 'team_a', 'team_b', 'winner', 'matches'],
    });
    if (!series)
      throw new NotFoundException(`La serie con ID ${id} no existe.`);
    return series;
  }

  async findByTournament(tournamentId: string): Promise<Serie[]> {
    return await this.seriesRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['tournament', 'team_a', 'team_b', 'winner', 'matches'],
      order: { round_order: 'ASC' },
    });
  }

  async reschedule(id: string, newDateIso: string): Promise<Serie> {
    const series = await this.findOne(id);
    series.scheduled_date = new Date(newDateIso);
    return await this.seriesRepository.save(series);
  }

  async update(id: string, updateData: Partial<Serie>): Promise<Serie> {
    const series = await this.findOne(id);
    Object.assign(series, updateData);
    return await this.seriesRepository.save(series);
  }

  async remove(id: string): Promise<void> {
    const series = await this.findOne(id);
    await this.seriesRepository.remove(series);
  }
}
