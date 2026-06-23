import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { getCorrelationId } from '../shared/context/request-context';
import { ListProspectsDto } from './dto/list-prospects.dto';
import { SearchProspectsDto } from './dto/search-prospects.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { ProspectsService } from './prospects.service';

@Controller('api/v1/admin/prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Get()
  list(@Query() query: ListProspectsDto, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-prospects-list');
    return this.prospectsService.list(query, correlationId);
  }

  @Post('search-osm')
  searchOsm(@Body() body: SearchProspectsDto, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-prospects-osm');
    return this.prospectsService.searchAndImport(body, correlationId);
  }

  @Get('options')
  options(@Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-prospects-options');
    return this.prospectsService.options(correlationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProspectDto,
    @Req() req: Request,
  ) {
    const correlationId = getCorrelationId(req, 'admin-prospects-update');
    return this.prospectsService.update(id, body, correlationId);
  }
}
