// pe-api/src/rosters/rosters.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RostersService } from './rosters.service';
import { RegisterTournamentRosterDto } from './dto/register-tournament-roster.dto';
import { DeclareMatchLineupDto } from './dto/declare-match-lineup.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('rosters')
export class RostersController {
  constructor(private readonly rostersService: RostersService) {}

  @Post('tournament/:tournamentId')
  @UseGuards(JwtAuthGuard)
  async registerRoster(
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Body() dto: RegisterTournamentRosterDto,
    @GetUser('id') requesterId: string,
  ) {
    return await this.rostersService.registerTournamentRoster(
      tournamentId,
      dto,
      requesterId,
    );
  }

  @Post('match/:matchId/declare')
  @UseGuards(JwtAuthGuard)
  async declareLineup(
    @Param('matchId', new ParseUUIDPipe()) matchId: string,
    @Body() dto: DeclareMatchLineupDto,
    @GetUser('id') requesterId: string,
  ) {
    return await this.rostersService.declareMatchLineup(
      matchId,
      dto,
      requesterId,
    );
  }

  @Get('tournament/:tournamentId')
  async getTournamentRoster(
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
    @Query('teamId') teamId?: string,
  ) {
    return await this.rostersService.getTournamentRosters(tournamentId, teamId);
  }

  @Get('match/:matchId')
  async getMatchRoster(@Param('matchId', new ParseUUIDPipe()) matchId: string) {
    return await this.rostersService.getMatchRosters(matchId);
  }
}
