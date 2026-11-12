// pe-api/src/tournaments/dto/create-tournament.dto.ts
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
import {
  TournamentType,
  SkillTier,
  SeriesFormat,
  ScheduleType,
} from '../entities/tournament.entity';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  name!: string;

  @IsEnum(TournamentType)
  @IsNotEmpty()
  type!: TournamentType;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsEnum(SkillTier)
  @IsNotEmpty()
  skill_tier!: SkillTier;

  @IsOptional()
  @IsEnum(SeriesFormat)
  default_series_format?: SeriesFormat = SeriesFormat.BO3;

  @IsOptional()
  @IsEnum(SeriesFormat)
  final_series_format?: SeriesFormat = SeriesFormat.BO3;

  @IsOptional()
  @IsEnum(ScheduleType)
  schedule_type?: ScheduleType = ScheduleType.SAME_DAY;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  days_between_rounds?: number = 7;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  hours_between_rounds?: number = 1.5;

  @IsDateString()
  @IsNotEmpty()
  registration_start_date!: string;

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
