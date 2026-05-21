import {
  IsUUID,
  IsInt,
  Min,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TeamReferenceDto {
  @IsUUID('4', { message: 'El ID del equipo debe ser un UUID válido' })
  @IsNotEmpty()
  id!: string;
}

export class CreateSeriesDto {
  @IsUUID('4')
  @IsNotEmpty()
  tournament_id!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamReferenceDto)
  team_a?: TeamReferenceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamReferenceDto)
  team_b?: TeamReferenceDto;

  @IsInt()
  @Min(1, { message: 'Se requiere al menos 1 victoria para ganar la serie' })
  wins_required!: number;

  @IsInt()
  @Min(1, { message: 'El orden de la ronda debe ser un número positivo' })
  round_order!: number;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del stage no puede estar vacío' })
  stage_name!: string;
}
