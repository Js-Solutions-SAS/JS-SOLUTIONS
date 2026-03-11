import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContractEntity } from '../../contracts/contract.entity';
import { LeadEntity } from '../../leads/lead.entity';
import { QuoteEntity } from '../../quotes/quote.entity';
import { DocumentEntity } from '../documents/document.entity';
import { ProjectMilestoneEntity } from './project-milestone.entity';
import { ProjectEntity } from './project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectMilestoneEntity,
      DocumentEntity,
      LeadEntity,
      QuoteEntity,
      ContractEntity,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [TypeOrmModule, ProjectsService],
})
export class ProjectsModule {}
