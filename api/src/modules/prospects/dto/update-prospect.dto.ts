import { IsOptional, IsString } from 'class-validator';

export class UpdateProspectDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
