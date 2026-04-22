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
  ConflictException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './Guards';
import { JwtPayload, RequestUser } from './jwt.strategy';
import { RiotService } from '../riot/riot.service';
import { UsersService } from '../users/users.service';
import { LinkAccountDto } from '../riot/dto/link-account.dto';

interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    riotGameName: string | null;
    riotRegion: string | null;
    soloTier: string | null;
    rankPoints: number;
  };
};

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth',
};

function withoutRefreshToken(
  tokens: AuthTokens,
): Omit<AuthTokens, 'refreshToken'> {
  const { refreshToken: _omit, ...result } = tokens;
  void _omit;
  return result;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly riotService: RiotService,
    private readonly usersService: UsersService,
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
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

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

  // ─── Vinculación con Riot Games ──────────────────────────────────────────

  @Post('link-riot')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async linkRiot(
    @Body() dto: LinkAccountDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const riotData = await this.riotService.getAccountData(dto.riotId);

    // Verificamos que la cuenta Riot no esté vinculada a otro usuario
    const existing = await this.usersService.findByPuuid(riotData.puuid);
    if (existing && existing.id !== req.user.id) {
      throw new ConflictException(
        'This Riot account is already linked to another user',
      );
    }

    await this.usersService.updateRiotData(req.user.id, {
      riotPuuid: riotData.puuid,
      riotGameName: riotData.gameName,
      riotTagLine: riotData.tagLine,
      riotRegion: 'LAS',
      soloTier: riotData.soloTier,
      soloRank: riotData.soloRank,
      soloLp: riotData.soloLp,
      flexTier: riotData.flexTier,
      flexRank: riotData.flexRank,
      flexLp: riotData.flexLp,
      rankPoints: riotData.rankPoints,
      rankUpdatedAt: new Date(),
    });

    return {
      message: 'Riot account linked successfully',
      gameName: riotData.gameName,
      tagLine: riotData.tagLine,
      soloQueue: riotData.soloTier
        ? `${riotData.soloTier} ${riotData.soloRank} (${riotData.soloLp} LP)`
        : 'Unranked',
      flexQueue: riotData.flexTier
        ? `${riotData.flexTier} ${riotData.flexRank} (${riotData.flexLp} LP)`
        : 'Unranked',
      rankPoints: riotData.rankPoints,
    };
  }
}
