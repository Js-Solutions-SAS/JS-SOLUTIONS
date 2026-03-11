import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../../auth/public.decorator';
import { getCorrelationId } from '../shared/context/request-context';
import { ProjectsService } from './projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get('api/v1/client/projects/:projectId/dashboard')
  getClientDashboard(
    @Param('projectId') projectId: string,
    @Req() req: Request,
  ) {
    const correlationId = getCorrelationId(req, 'client-dashboard');
    return this.projectsService.getClientDashboardByProjectId(
      projectId,
      correlationId,
    );
  }

  @Public()
  @Get('api/v1/client/projects/dashboard')
  getClientDashboardByToken(@Query('clientToken') clientToken: string, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'client-dashboard-token');
    return this.projectsService.getClientDashboardByToken(clientToken, correlationId);
  }

  @Get('api/v1/admin/milestones')
  listAdminMilestones(@Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-milestones');
    return this.projectsService.listAdminMilestones(correlationId);
  }
}
