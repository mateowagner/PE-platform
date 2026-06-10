import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Body,
  Patch,
  Get,
  Req,
  Delete,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/Guards';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Tournament } from './entities/tournament.entity';
import { InscribeTeamDto } from './dto/inscribe-team.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { Request } from 'express';
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createTournamentDto: CreateTournamentDto,
    @GetUser('id') creatorId: string, // <-- Magia pura, sin 'any'
  ) {
    return await this.tournamentsService.create(createTournamentDto, creatorId);
  }

  @Get()
  async findAll() {
    return await this.tournamentsService.findAll();
  }

  @Get(':id')
  async getTournamentDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<unknown> {
    return await this.tournamentsService.getTournamentDetails(id);
  }

  @Post(':id/inscribe')
  @UseGuards(JwtAuthGuard)
  async inscribeTeam(
    @Param('id', ParseUUIDPipe) tournamentId: string,
    @Body() dto: InscribeTeamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.tournamentsService.inscribeTeam(
      tournamentId,
      req.user.id,
      dto.teamId,
    );
    return { message: 'Equipo inscripto exitosamente al torneo.' };
  }
  @Delete(':id/inscribe/:teamId')
  @UseGuards(JwtAuthGuard)
  async cancelInscription(
    @Param('id', ParseUUIDPipe) tournamentId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.tournamentsService.cancelInscription(
      tournamentId,
      req.user.id,
      teamId,
    );
    return { message: 'Inscripción cancelada exitosamente.' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTournamentDto: Partial<Tournament>,
  ) {
    return await this.tournamentsService.update(id, updateTournamentDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tournamentsService.remove(id);
    return { message: `Torneo ${id} eliminado correctamente.` };
  }
  @Post(':id/generate-fixture')
  @UseGuards(JwtAuthGuard)
  async generateFixture(@Param('id', ParseUUIDPipe) id: string) {
    await this.tournamentsService.generateFixture(id);
    return { message: '¡Fixture y estructura del torneo generados con éxito!' };
  }

  @Get(':id/series')
  async getTournamentSeries(@Param('id', ParseUUIDPipe) id: string) {
    return await this.tournamentsService.getTournamentSeries(id);
  }
}
