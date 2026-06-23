import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProspectEntity } from './prospect.entity';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProspectEntity])],
  controllers: [ProspectsController],
  providers: [ProspectsService],
})
export class ProspectsModule {}
