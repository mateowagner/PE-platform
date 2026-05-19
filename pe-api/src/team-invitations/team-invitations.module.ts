import { Module } from '@nestjs/common';
import { TeamInvitationsService } from './team-invitations.service';
import { TeamInvitationsController } from './team-invitations.controller';
import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamInvitation } from './entities/team-invitation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TeamInvitation, Team, User])],
  controllers: [TeamInvitationsController],
  providers: [TeamInvitationsService],
})
export class TeamInvitationsModule {}
