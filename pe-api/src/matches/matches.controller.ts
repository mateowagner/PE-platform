// pe-api/src/matches/matches.controller.ts
import {
  Controller,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  Get,
  Delete,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { WebhookRiotDto } from './dto/update-match-webhook.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RiotWebhookGuard } from './guards/riot-webhook.guard';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('webhook')
  @UseGuards(RiotWebhookGuard)
  async handleRiotWebhook(@Body() data: WebhookRiotDto) {
    return await this.matchesService.processRiotWebhook(data);
  }

  // 1. Asignar/Regenerar Sala y Contraseña de la Personalizada
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/credentials')
  async setCredentials(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { lobby_name?: string; lobby_password?: string },
  ) {
    return this.matchesService.setLobbyCredentials(
      id,
      body.lobby_name,
      body.lobby_password,
    );
  }

  // 2. Iniciar la Partida (Pasa a status STARTED y fija start_date)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/start')
  async startMatch(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.matchesService.startMatch(id);
  }

  // 3. Completar Partida Pegando el ID de Riot Games (ej: "1621435769" o "LA2_1621435769")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post(':id/complete-riot')
  async completeByRiotId(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('riot_match_id') riotMatchId: string,
  ) {
    return this.matchesService.completeMatchByRiotId(id, riotMatchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/override')
  async manualOverride(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { winnerTeamId: string; notes?: string },
  ) {
    return this.matchesService.manualMatchOverride(
      id,
      body.winnerTeamId,
      body.notes,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  async create(
    @Body() createMatchDto: { series_id: string; match_order: number },
  ) {
    return this.matchesService.create(
      createMatchDto.series_id,
      createMatchDto.match_order,
    );
  }

  @Get()
  async findAll() {
    return this.matchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.matchesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMatchDto: Record<string, any>,
  ) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.matchesService.remove(id);
    return { message: `Mapa ${id} eliminado correctamente.` };
  }

  @Get('team/:teamId')
  async getMatchesByTeam(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('status') status?: 'pending' | 'finished',
  ) {
    return await this.matchesService.findMatchesByTeam(teamId, status);
  }
}
