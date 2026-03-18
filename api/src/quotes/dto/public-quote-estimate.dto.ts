import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PublicQuoteEstimateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  companyName!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @IsString()
  @MaxLength(220)
  serviceInterest!: string;

  @IsString()
  @MinLength(5)
  transcription!: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  @IsIn(['preview', 'send'])
  mode?: 'preview' | 'send';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

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
