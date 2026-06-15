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
import { JwtAuthGuard, RolesGuard } from '../auth/Guards'; // ➔ Importamos ambos guardianes desde tu archivo unificado
import { Roles } from '../auth/roles.decorator'; // ➔ Importamos tu decorador de roles
import { UserRole } from '../users/entities/user.entity'; // ➔ Fuente de la verdad de los roles
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Tournament } from './entities/tournament.entity';
import { InscribeTeamDto } from './dto/inscribe-team.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // ─── RUTAS ADMINISTRATIVAS (PROTEGIDAS POR ROL) ───────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // ➔ Primero autentica, luego verifica rol
  @Roles(UserRole.ADMIN) // ➔ Restringido a Administradores
  async create(
    @Body() createTournamentDto: CreateTournamentDto,
    @GetUser('id') creatorId: string,
  ) {
    return await this.tournamentsService.create(createTournamentDto, creatorId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // ➔ Corrección: Evita que cualquiera edite la configuración del torneo
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTournamentDto: Partial<Tournament>,
  ) {
    return await this.tournamentsService.update(id, updateTournamentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // ➔ Corrección: Blindaje total contra destrucciones accidentales o maliciosas
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tournamentsService.remove(id);
    return { message: `Torneo ${id} eliminado correctamente.` };
  }

  @Post(':id/generate-fixture')
  @UseGuards(JwtAuthGuard, RolesGuard) // ➔ Aquí es donde se conecta de forma segura el botón "Arrancar Torneo"
  @Roles(UserRole.ADMIN)
  async generateFixture(@Param('id', ParseUUIDPipe) id: string) {
    await this.tournamentsService.generateFixture(id);
    return { message: '¡Fixture y estructura del torneo generados con éxito!' };
  }

  // ─── RUTAS PÚBLICAS O DE PARTICIPANTES (USUARIOS LOGUEADOS) ────────────────

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

  @Get(':id/series')
  async getTournamentSeries(@Param('id', ParseUUIDPipe) id: string) {
    return await this.tournamentsService.getTournamentSeries(id);
  }

  @Post(':id/inscribe')
  @UseGuards(JwtAuthGuard) // ➔ Cualquier usuario autenticado (ej: un Capitán) puede intentar inscribirse
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
  @UseGuards(JwtAuthGuard) // ➔ Cualquier usuario autenticado puede intentar cancelar su propia inscripción
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
}
