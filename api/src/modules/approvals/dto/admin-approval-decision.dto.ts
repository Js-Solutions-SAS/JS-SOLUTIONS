import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AdminApprovalDecisionDto {
  @IsIn(['approved', 'rejected', 'blocked'])
  decision!: 'approved' | 'rejected' | 'blocked';

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
