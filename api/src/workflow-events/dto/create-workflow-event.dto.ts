import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWorkflowEventDto {
  @IsString()
  @MaxLength(100)
  workflowName!: string;

  @IsString()
  @MaxLength(100)
  eventName!: string;

  @IsString()
  @IsIn(['success', 'error', 'warning'])
  status!: 'success' | 'error' | 'warning';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorMessage?: string;
}
