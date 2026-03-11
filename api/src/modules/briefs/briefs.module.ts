import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PublicRateLimitGuard } from '../../auth/public-rate-limit.guard';
import { BriefSubmissionEntity } from '../../leads/brief-submission.entity';
import { LeadEntity } from '../../leads/lead.entity';
import { ProjectEntity } from '../projects/project.entity';
import { BriefsController } from './briefs.controller';
import { BriefsService } from './briefs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadEntity, BriefSubmissionEntity, ProjectEntity]),
  ],
  controllers: [BriefsController],
  providers: [BriefsService, PublicRateLimitGuard],
  exports: [BriefsService],
})
export class BriefsModule {}
