import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GenerateQuoteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  leadId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(180)
  clientToken!: string;

  @IsString()
  @MinLength(5)
  transcripcion!: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsString()
  @IsIn(['preview', 'send'])
  mode!: 'preview' | 'send';

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}
