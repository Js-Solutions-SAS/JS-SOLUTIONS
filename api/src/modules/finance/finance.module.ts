import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FinanceController } from './finance.controller';
import { FinanceEntryEntity } from './finance-entry.entity';
import { FinanceService } from './finance.service';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceEntryEntity])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [TypeOrmModule],
})
export class FinanceModule {}
