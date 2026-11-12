// pe-api/src/tournaments/tournaments.controller.ts
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
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { InscribeTeamDto } from './dto/inscribe-team.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // ─── RUTAS ADMINISTRATIVAS (PROTEGIDAS POR ROL) ───────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createTournamentDto: CreateTournamentDto,
    @GetUser('id') creatorId: string,
  ) {
    return await this.tournamentsService.create(createTournamentDto, creatorId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    return await this.tournamentsService.update(id, updateTournamentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.tournamentsService.remove(id);
    return { message: `Torneo ${id} eliminado correctamente.` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post(':id/start')
  async startTournament(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.tournamentsService.generateFixture(id);
  }

  // ─── RUTAS PÚBLICAS O DE PARTICIPANTES ────────────────────────────────────

  @Get()
  async findAll() {
    return await this.tournamentsService.findAll();
  }

  @Get(':id')
  async getTournamentDetails(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<unknown> {
    return await this.tournamentsService.getTournamentDetails(id);
  }

  @Get(':id/series')
  async getTournamentSeries(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.tournamentsService.getTournamentSeries(id);
  }

  @Post(':id/inscribe')
  @UseGuards(JwtAuthGuard)
  async inscribeTeam(
    @Param('id', new ParseUUIDPipe()) tournamentId: string,
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
    @Param('id', new ParseUUIDPipe()) tournamentId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.tournamentsService.cancelInscription(
      tournamentId,
      req.user.id,
      teamId,
    );
    return { message: 'Inscripción cancelada exitosamente.' };
  }
}
