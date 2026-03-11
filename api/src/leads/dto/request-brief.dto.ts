import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestBriefDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  requestId?: string;

  @IsOptional()
  @IsBoolean()
  forceResend?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}
