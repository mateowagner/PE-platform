import {
  Controller,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  Get,
  Delete,
  Patch,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Match } from './entities/match.entity';
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  // Endpoint preparado para recibir el evento de finalización (Webhook de Riot o admin manual)
  @Post(':id/result')
  async reportResult(
    @Param('id', ParseUUIDPipe) matchId: string,
    @Body()
    resultData: {
      riot_match_id: string;
      winner_team_id: string;
      stats: Record<string, any>;
    },
  ) {
    const { riot_match_id, winner_team_id, stats } = resultData;

    return await this.matchesService.reportMatchResult(
      matchId,
      riot_match_id,
      winner_team_id,
      stats,
    );
  }
  @Post()
  async create(
    @Body() createMatchDto: { series_id: string; match_order: number },
  ) {
    return await this.matchesService.create(
      createMatchDto.series_id,
      createMatchDto.match_order,
    );
  }

  @Get()
  async findAll() {
    return await this.matchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.matchesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMatchDto: Partial<Match>, // Idealmente usarías un UpdateMatchDto acá
  ) {
    return await this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.matchesService.remove(id);
    return { message: `Mapa ${id} eliminado correctamente.` };
  }
}
