import { Module } from '@nestjs/common';
import { RiotService } from './riot.service';
import { RiotController } from './riot.controller';

@Module({
  controllers: [RiotController],
  providers: [RiotService],
  exports: [RiotService],
})
export class RiotModule {}
