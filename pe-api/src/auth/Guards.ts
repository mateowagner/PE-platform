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
    // 1. Buscamos los roles usando la clave string 'roles' que definiste en tu decorador
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    // Si el endpoint no exige roles (ej: el login), pasa de largo
    if (!requiredRoles) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>(); // ➔ El usuario puede ser opcional si falla el JWT

    // 2. EL BLINDAJE: Validamos que req.user exista antes de preguntar por su rol
    if (!req.user || !req.user.role) {
      throw new ForbiddenException(
        'No tenés permisos válidos o tu sesión expiró.',
      );
    }

    // 3. Comparamos contra tu enum real de la Base de Datos
    const hasPermission = requiredRoles.includes(req.user.role as UserRole);

    if (!hasPermission) {
      throw new ForbiddenException(
        'Acceso denegado: Se requieren permisos de Administrador.',
      );
    }

    return true;
  }
}
