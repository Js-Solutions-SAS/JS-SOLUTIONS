import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AdminChangeRequestDecisionDto {
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(400)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}
