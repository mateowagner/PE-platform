import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { RescheduleSeriesDto } from './dto/reschedule-series.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateSeriesDto } from './dto/create-series.dto';
import { Serie } from './entities/series.entity';
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
  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleSeriesDto,
  ) {
    return await this.seriesService.reschedule(id, dto.scheduled_date);
  }
}
