import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/Guards';
import { RequestUser } from '../auth/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // Crear equipo — el usuario autenticado se convierte en owner y primer miembro
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTeamDto, @Req() req: AuthenticatedRequest) {
    return this.teamsService.createWithOwner(dto, req.user.id);
  }

  // Mi equipo — devuelve el equipo del usuario autenticado
  @Get('my-team')
  @UseGuards(JwtAuthGuard)
  getMyTeam(@Req() req: AuthenticatedRequest) {
    return this.teamsService.findByMember(req.user.id);
  }

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.teamsService.getMembers(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
