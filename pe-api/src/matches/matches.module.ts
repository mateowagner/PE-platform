import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { Match } from './entities/match.entity';
import { Serie } from '../series/entities/series.entity';

@Module({
  // Importamos la serie porque MatchesService usa el seriesRepository
  imports: [TypeOrmModule.forFeature([Match, Serie])],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
