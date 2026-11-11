// pe-api/src/standings/standings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Standing } from './entities/standing.entity';
import { Serie } from '../series/entities/series.entity';
import { StandingsService } from './standings.service';
import { StandingsController } from './standings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Standing, Serie])],
  controllers: [StandingsController],
  providers: [StandingsService],
  exports: [StandingsService, TypeOrmModule],
})
export class StandingsModule {}
