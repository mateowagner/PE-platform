import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class CreateTeamDto {
  @IsString()
  owner_id?: string;
  @IsString()
  @MinLength(3)
  @MaxLength(25)
  name!: string;
  @IsString()
  @IsOptional()
  @MinLength(1)
  logo_url?: string;
}
