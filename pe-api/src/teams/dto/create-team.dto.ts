import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(3)
  @MaxLength(25)
  name!: string;

  @IsString()
  @IsOptional()
  logo_url?: string;
}
