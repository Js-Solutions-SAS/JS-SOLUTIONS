import {
  IsIn,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class WhatsappInboundEventDto {
  @IsString()
  @MaxLength(80)
  provider!: string;

  @IsString()
  @MaxLength(200)
  externalChatId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalContactId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalMessageId?: string;

  @IsString()
  @IsIn(['text', 'image', 'audio', 'video', 'document', 'interactive', 'other'])
  messageType!:
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'document'
    | 'interactive'
    | 'other';

  @IsOptional()
  @IsString()
  text?: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  correlationId?: string;
}
