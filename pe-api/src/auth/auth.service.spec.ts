import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mockeamos bcrypt para que los tests no sean lentos por el hashing real
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

const mockUser = {
  id: 'uuid-123',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashed_password',
  role: 'USER',
  refreshTokenHash: 'hashed_refresh',
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock_token'),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('test_secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = {
      username: 'newuser',
      email: 'new@test.com',
      password: 'Password1',
    };

    it('should register a new user and return tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.register(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email, username: dto.username }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ConflictException if email is taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username is taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login('test@test.com', 'Password1');

      expect(result).toHaveProperty('accessToken');
      expect(result.username).toBe(mockUser.username);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('wrong@test.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear the refresh token hash in DB', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout('uuid-123');

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        'uuid-123',
        null,
      );
    });
  });
});
