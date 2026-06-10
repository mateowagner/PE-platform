import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  // Solo letras, números, guiones y guiones bajos
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and hyphens',
  })
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  // Al menos una mayúscula, una minúscula y un número
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter and one number',
  })
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
