import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/public.decorator';

@Controller()
export class RootController {
  @Public()
  @Get()
  index() {
    return {
      success: true,
      service: 'api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        healthDb: '/health/db',
      },
    };
  }
}
