import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApprovalEntity } from './approval.entity';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalEntity])],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [TypeOrmModule, ApprovalsService],
})
export class ApprovalsModule {}
