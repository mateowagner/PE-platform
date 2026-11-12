// pe-api/src/rosters/dto/register-tournament-roster.dto.ts
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RosterMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsBoolean()
  isSubstitute: boolean = false;
}

export class RegisterTournamentRosterDto {
  @IsUUID()
  @IsNotEmpty()
  teamId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RosterMemberDto)
  members!: RosterMemberDto[];
}
