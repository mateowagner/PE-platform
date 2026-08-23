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
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { WebhookRiotDto } from './dto/update-match-webhook.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  // 1. ENDPOINT PÚBLICO: Recepción de Webhooks de Riot Games (Sin Guards)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleRiotWebhook(@Body() webhookData: WebhookRiotDto) {
    return this.matchesService.processRiotWebhook(webhookData);
  }

  // 2. PRIVADO (STAFF / ADMIN): Override manual de resultado
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

  // 3. PRIVADO (STAFF / ADMIN): Creación manual de Match
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

  // 4. LECTURAS PÚBLICAS
  @Get()
  async findAll() {
    return this.matchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.matchesService.findOne(id);
  }

  // 5. PRIVADO (STAFF / ADMIN): Edición general y eliminación
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
}
