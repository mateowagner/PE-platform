// pe-api/src/matches/matches.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Serie } from '../series/entities/series.entity';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { RostersModule } from '../rosters/rosters.module';
import { RiotModule } from '../riot/riot.module';
import { MatchRoster } from '../rosters/entities/match-roster.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Serie, MatchRoster]),
    RostersModule,
    RiotModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService, TypeOrmModule],
})
export class MatchesModule {}
