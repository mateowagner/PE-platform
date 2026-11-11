// pe-api/src/auth/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserRole } from '../users/entities/user.entity';
import { RequestUser } from './jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();

    if (!req.user || !req.user.role) {
      throw new ForbiddenException(
        'No tenés permisos válidos o tu sesión expiró.',
      );
    }

    const hasPermission = requiredRoles.includes(req.user.role as UserRole);

    if (!hasPermission) {
      throw new ForbiddenException(
        'Acceso denegado: Se requieren permisos de Administrador.',
      );
    }

    return true;
  }
}
