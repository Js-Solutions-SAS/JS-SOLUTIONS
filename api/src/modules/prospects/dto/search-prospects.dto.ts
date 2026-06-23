import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProspectsDto {
  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  vertical?: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enrichWebsites?: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  bbox?: [number, number, number, number];
}
