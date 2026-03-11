import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class PaymentCallbackDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  providerReference?: string;

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
