import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChangeRequestEntity } from './change-request.entity';
import { ChangeRequestsController } from './change-requests.controller';
import { ChangeRequestsService } from './change-requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeRequestEntity])],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService],
  exports: [TypeOrmModule],
})
export class ChangeRequestsModule {}
