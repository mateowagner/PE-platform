import {
  IsString,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// Sub-DTO para validar a los jugadores que vienen en el array
class RiotPlayerDto {
  @IsString()
  @IsNotEmpty()
  summonerName!: string;

  // Podés sumar championId, kills, deaths, etc., si los necesitás a futuro.
}

export class WebhookRiotDto {
  @IsNumber()
  @IsNotEmpty()
  startTime!: number; // Timestamp en milisegundos de Riot

  @IsString()
  @IsNotEmpty()
  shortCode!: string; // El tournament_code (ej. LAS-123456789)

  @IsUUID('4') // ➔ CRÍTICO: Obligamos a que sea un UUID v4 (nuestro match.id)
  @IsNotEmpty()
  metaData!: string;

  @IsNumber()
  @IsNotEmpty()
  gameId!: number; // El riot_match_id interno

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiotPlayerDto)
  winningTeam!: RiotPlayerDto[]; // Array con los ganadores
}
