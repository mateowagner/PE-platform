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
import { JwtAuthGuard } from '../auth/Guards'; // Ajustá el path según tu proyecto
import { Request } from 'express';
import { CreateTeamInvitationDto } from './dto/create-team-invitation.dto';

// Asumiendo que tenés una interfaz definida para tu request autenticado
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    // ... otros campos del JWT payload
  };
}

@Controller('invitations')
export class TeamInvitationsController {
  constructor(
    private readonly teamInvitationsService: TeamInvitationsService,
  ) {}

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
  @Post(':teamId')
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
  @Get('pending-invitations')
  @UseGuards(JwtAuthGuard)
  async getMyInvitations(@Req() req: AuthenticatedRequest) {
    const invitations =
      await this.teamInvitationsService.getInvitationsByUserId(req.user.id);
    return { invitations };
  }
  /*@Get(':id')
  @UseGuards(JwtAuthGuard)
  async getInvitation(@Param('id', ParseUUIDPipe) invitationId: string) {
    const invitation =
      await this.teamInvitationsService.getInvitationById(invitationId);
    return { invitation };
  }*/
}
