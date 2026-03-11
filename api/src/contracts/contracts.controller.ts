import { Body, Controller, Post } from '@nestjs/common';

import { GenerateContractDto } from './dto/generate-contract.dto';
import { ContractsService } from './contracts.service';

@Controller('api/v1/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('generate')
  generateContract(@Body() dto: GenerateContractDto) {
    return this.contractsService.generateContract(dto);
  }
}
