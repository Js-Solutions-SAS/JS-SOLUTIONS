import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RaidController } from './raid.controller';
import { RaidItemEntity } from './raid-item.entity';
import { RaidService } from './raid.service';

@Module({
  imports: [TypeOrmModule.forFeature([RaidItemEntity])],
  controllers: [RaidController],
  providers: [RaidService],
  exports: [TypeOrmModule],
})
export class RaidModule {}
