import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateContractDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  leadId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  email?: string;

  @IsString()
  @MaxLength(80)
  estado!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}
