import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLeadIntakeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  empresa!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  servicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}
