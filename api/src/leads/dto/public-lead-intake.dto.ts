import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PublicLeadIntakeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  companyName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @IsString()
  @MaxLength(220)
  serviceInterest!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;

  @IsString()
  @MaxLength(80)
  source!: string;

  @IsOptional()
  @IsObject()
  utm?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  landingPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}
