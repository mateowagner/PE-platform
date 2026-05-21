import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Body,
  Patch,
  Get,
  Delete,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/Guards';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { GetUser } from '../common/decorators/get-user.decorator'; // Ajustá la ruta si es necesario
import { Tournament } from './entities/tournament.entity';
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post(':id/enroll/:teamId')
  @UseGuards(JwtAuthGuard)
  async enrollTeam(
    @Param('id', ParseUUIDPipe) tournamentId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @GetUser('id') captainId: string, // <-- Magia pura, sin 'any'
  ) {
    return await this.tournamentsService.enrollTeam(
      tournamentId,
      teamId,
      captainId,
    );
  }

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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.tournamentsService.findOne(id);
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
}
