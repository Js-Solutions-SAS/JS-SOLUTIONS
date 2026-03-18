import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const ALLOWED_EVENTS = ['ViewContent', 'Search', 'FindLocation'] as const;

export class PublicMarketingEventDto {
  @IsString()
  @IsIn(ALLOWED_EVENTS)
  eventName!: (typeof ALLOWED_EVENTS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  eventSourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  searchString?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  externalId?: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;
}
