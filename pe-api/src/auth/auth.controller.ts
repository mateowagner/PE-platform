import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './Guards';
import { JwtPayload } from './jwt.strategy';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

// Extiende el tipo Request de Express para incluir req.user
interface AuthenticatedRequest extends Request {
  user: { id: string; username: string; role: string };
}

// Tipo de retorno de AuthService para poder omitir refreshToken de forma segura
type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  username: string;
  userId: string;
  role: string;
};

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth',
};

// Omite refreshToken del body de respuesta de forma type-safe
function withoutRefreshToken(
  tokens: AuthTokens,
): Omit<AuthTokens, 'refreshToken'> {
  const { refreshToken: _omit, ...result } = tokens;
  void _omit; // marca explícita para ESLint: la variable es intencionalmente descartada
  return result;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    return withoutRefreshToken(tokens);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto.email, dto.password);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    return withoutRefreshToken(tokens);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Tipamos cookies explícitamente para evitar `any`
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    // Verificamos y decodificamos con el secret del refresh token.
    // Esto reemplaza el decode manual (que era `any` y no verificaba la firma).
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.authService.refreshTokens(
      payload.sub,
      refreshToken,
    );
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    return withoutRefreshToken(tokens);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id);
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
    return { message: 'Logged out successfully' };
  }
  @SkipThrottle()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
