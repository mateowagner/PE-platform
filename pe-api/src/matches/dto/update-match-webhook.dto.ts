// pe-api/src/matches/dto/update-match-webhook.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WinningTeamPlayerDto {
  @IsString()
  @IsNotEmpty()
  summonerName!: string;

  @IsString()
  @IsOptional()
  puuid?: string;
}

export class WebhookRiotDto {
  @IsNumber()
  @IsNotEmpty()
  startTime!: number;

  @IsString()
  @IsNotEmpty()
  shortCode!: string;

  @IsString()
  @IsNotEmpty()
  metaData!: string; // UUID del Match

  @IsNumber()
  @IsNotEmpty()
  gameId!: number;

  @IsString()
  @IsOptional()
  gameName?: string;

  @IsString()
  @IsOptional()
  gameType?: string;

  @IsNumber()
  @IsOptional()
  gameMap?: number;

  @IsString()
  @IsOptional()
  gameMode?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WinningTeamPlayerDto)
  winningTeam!: WinningTeamPlayerDto[];
}
