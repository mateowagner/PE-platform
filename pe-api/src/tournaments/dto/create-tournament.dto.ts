import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsDateString,
  IsOptional,
  MinLength,
} from 'class-validator';
import { TournamentType, SkillTier } from '../entities/tournament.entity';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  name!: string;

  @IsEnum(TournamentType)
  @IsNotEmpty()
  type!: TournamentType;

  @IsEnum(SkillTier)
  @IsNotEmpty()
  skill_tier!: SkillTier;

  @IsDateString()
  @IsNotEmpty()
  registration_start_date!: string; // Se recibe como string (ISO 8601) y TypeORM lo castea

  @IsDateString()
  @IsNotEmpty()
  registration_end_date!: string;

  @IsDateString()
  @IsNotEmpty()
  start_date!: string;

  @IsInt()
  @Min(2)
  @Max(64)
  max_teams!: number;

  @IsNumber()
  @Min(0)
  entry_fee!: number;

  @IsOptional()
  @IsString()
  prize_pool?: string;
}
