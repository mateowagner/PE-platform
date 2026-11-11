// pe-api/src/rosters/rosters.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentRoster } from './entities/tournament-roster.entity';
import { MatchRoster } from './entities/match-roster.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Match } from '../matches/entities/match.entity';
import { RostersService } from './rosters.service';
import { RostersController } from './rosters.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentRoster,
      MatchRoster,
      Tournament,
      Team,
      User,
      Match,
    ]),
  ],
  controllers: [RostersController],
  providers: [RostersService],
  exports: [RostersService, TypeOrmModule],
})
export class RostersModule {}
