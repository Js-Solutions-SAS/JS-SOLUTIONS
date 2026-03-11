import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SignatureCallbackDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  provider?: string;

  @IsIn(['quote', 'contract'])
  resourceType!: 'quote' | 'contract';

  @IsString()
  @MaxLength(200)
  envelopeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadId?: string;

  @IsString()
  @MaxLength(120)
  eventType!: string;

  @IsString()
  @MaxLength(80)
  status!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}
