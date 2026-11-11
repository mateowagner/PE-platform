// pe-api/src/standings/standings.controller.ts
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get('tournament/:tournamentId')
  async getByTournament(
    @Param('tournamentId', new ParseUUIDPipe()) tournamentId: string,
  ) {
    return this.standingsService.getTournamentStandings(tournamentId);
  }
}
