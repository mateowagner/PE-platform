// pe-api/src/team-invitations/team-invitations.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import { TeamInvitationsService } from './team-invitations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ajustado al estándar del proyecto
import { Request } from 'express';
import { CreateTeamInvitationDto } from './dto/create-team-invitation.dto';
import { SendInvitationByIdentifierDto } from './dto/send-invitation-identifier.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@Controller('invitations')
export class TeamInvitationsController {
  constructor(
    private readonly teamInvitationsService: TeamInvitationsService,
  ) {}

  // 1. Enviar invitación por identificador amigable (Username o Riot ID #Tag)
  @Post('team/:teamId/send')
  @UseGuards(JwtAuthGuard)
  async sendByIdentifier(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @GetUser('id') inviterId: string,
    @Body() dto: SendInvitationByIdentifierDto,
  ) {
    return await this.teamInvitationsService.sendInvitationByIdentifier(
      teamId,
      inviterId,
      dto.identifier,
    );
  }

  // 2. Enviar invitación tradicional por UUID de usuario
  @Post('team/:teamId/by-userid')
  @UseGuards(JwtAuthGuard)
  async sendInvitation(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateTeamInvitationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const inviterId = req.user.id;
    const inviteeId = dto.userId;

    const invitation = await this.teamInvitationsService.sendInvitation(
      teamId,
      inviterId,
      inviteeId,
    );

    return {
      message: 'Invitación enviada exitosamente.',
      invitationId: invitation.id,
      expiresAt: invitation.expiresAt,
    };
  }

  // 3. Aceptar invitación pendiente
  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Param('id', ParseUUIDPipe) invitationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.teamInvitationsService.acceptInvitation(
      req.user.id,
      invitationId,
    );

    return {
      message: 'Invitación aceptada. Te has unido al equipo exitosamente.',
    };
  }

  // 4. Rechazar invitación pendiente
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectInvitation(
    @Param('id', ParseUUIDPipe) invitationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.teamInvitationsService.rejectInvitation(
      req.user.id,
      invitationId,
    );

    return {
      message: 'Has rechazado la invitación exitosamente.',
    };
  }

  // 5. Consultar invitaciones pendientes del usuario logueado
  @Get('pending-invitations')
  @UseGuards(JwtAuthGuard)
  async getMyInvitations(@GetUser('id') userId: string) {
    return await this.teamInvitationsService.getInvitationsByUserId(userId);
  }
}
