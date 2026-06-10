import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from './jwt.strategy';

export enum Role {
  USER = 'USER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    // Casteamos req a un tipo que incluye user tipado, eliminando el `any`
    const req = context
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();
    return requiredRoles.includes(req.user.role as Role);
  }
}
