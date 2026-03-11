import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ClientApprovalDto {
  @IsString()
  @MaxLength(40)
  resourceType!: 'deliverable' | 'quote' | 'contract';

  @IsString()
  @MaxLength(200)
  resourceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  resourceName?: string;

  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(400)
  comment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  clientToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  projectId?: string;

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
