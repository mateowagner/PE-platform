// pe-api/src/team-invitations/dto/send-invitation-identifier.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SendInvitationByIdentifierDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  identifier!: string;
}
