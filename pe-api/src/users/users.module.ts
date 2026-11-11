import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { RiotModule } from '../riot/riot.module';
import { RankSyncService } from './rank-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team]), RiotModule],
  controllers: [UsersController],
  providers: [UsersService, RankSyncService],
  exports: [UsersService, RankSyncService],
})
export class UsersModule {}
