import { IsString, Matches } from 'class-validator';

export class LinkAccountDto {
  @IsString()
  @Matches(/^.+#.+$/, {
    message: 'Riot ID must be in the format NickName#TAG (e.g. Player#LAS)',
  })
  riotId!: string;
}
