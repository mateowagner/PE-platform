import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  username!: string;
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/, {
    message:
      'Password must have at least 7 characters, one uppercase, one lowercase and one number',
  })
  password!: string;
}
