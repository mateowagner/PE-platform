import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/auth.dto';
import { UserRole } from '../users/entities/user.entity';
interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    riotGameName: string | null;
    riotTagLine: string | null;
    riotRegion: string | null;
    soloTier: string | null;
    soloRank: string | null;
    soloLp: number;
    flexTier: string | null;
    flexRank: string | null;
    flexLp: number;
    rankPoints: number;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername) throw new ConflictException('Username already taken');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: hashed,
    });

    return this.generateTokens(user.id, user.username, user.role);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.username, user.role);
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthResult> {
    const user = await this.usersService.findById(userId);
    if (!user?.refreshTokenHash) throw new UnauthorizedException();

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenMatches) throw new UnauthorizedException('Invalid refresh token');

    return this.generateTokens(user.id, user.username, user.role);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(
    userId: string,
    username: string,
    role: UserRole, // ➔ Cambiado de 'string' a 'UserRole' para mantener el tipado fuerte
  ): Promise<AuthResult> {
    // El payload ya guarda el rol correctamente, lo dejamos intacto
    const payload = { sub: userId, username, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      }),
    ]);

    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hash);

    // Buscamos el usuario completo para devolver al frontend
    const user = await this.usersService.findById(userId);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user!.id,
        username: user!.username,
        email: user!.email,
        role: user!.role, // ➔ Esto ya viaja bien mapeado al cliente
        riotGameName: user!.riotGameName,
        riotTagLine: user!.riotTagLine,
        riotRegion: user!.riotRegion,
        soloTier: user!.soloTier,
        soloRank: user!.soloRank,
        soloLp: user!.soloLp ?? 0,
        flexTier: user!.flexTier,
        flexRank: user!.flexRank,
        flexLp: user!.flexLp ?? 0,
        rankPoints: user!.rankPoints,
      },
    };
  }
}
