// pe-api/src/rosters/dto/declare-match-lineup.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
} from 'class-validator';

export class DeclareMatchLineupDto {
  @IsUUID()
  @IsNotEmpty()
  teamId!: string;

  @IsArray()
  @ArrayMinSize(5, { message: 'Debes presentar exactamente 5 jugadores.' })
  @ArrayMaxSize(5, { message: 'Debes presentar exactamente 5 jugadores.' })
  @IsString({ each: true })
  playerPuuids!: string[];
}
