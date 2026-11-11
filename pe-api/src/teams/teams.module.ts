import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, User, Tournament])],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TypeOrmModule, TeamsService],
})
export class TeamsModule {}
