import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { Serie } from './entities/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  async create(@Body() createSeriesDto: CreateSeriesDto) {
    return await this.seriesService.create(createSeriesDto);
  }

  @Get()
  async findAll() {
    return await this.seriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.seriesService.findOne(id);
  }
  @Get('tournament/:tournamentId')
  async findByTournament(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
  ) {
    return await this.seriesService.findByTournament(tournamentId);
  }
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSeriesDto: Partial<Serie>,
  ) {
    return await this.seriesService.update(id, updateSeriesDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.seriesService.remove(id);
    return { message: `Serie ${id} eliminada correctamente.` };
  }
}
