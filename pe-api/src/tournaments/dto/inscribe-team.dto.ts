import { IsUUID } from 'class-validator';

export class InscribeTeamDto {
  @IsUUID()
  teamId!: string;
}
