import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateTeamInvitationDto {
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido.' })
  @IsNotEmpty()
  userId!: string;
}
