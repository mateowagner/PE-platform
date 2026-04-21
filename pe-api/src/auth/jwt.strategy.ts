import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

// Tipo explícito de lo que se inyecta en req.user
export interface RequestUser {
  id: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');

    // Retorno tipado explícitamente → req.user deja de ser `any`
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
