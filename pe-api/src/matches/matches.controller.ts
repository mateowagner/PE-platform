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
import { WebhookRiotDto } from './dto/update-match-webhook.dto';
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('webhook')
  async handleRiotWebhook(@Body() webhookData: WebhookRiotDto) {
    // El ID del partido viaja oculto dentro de metaData gracias a nuestro truco
    return await this.matchesService.processRiotWebhook(webhookData);
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
