import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 1. Tipamos exactamente lo que devuelve tu estrategia JWT
export interface RequestUser {
  id?: string; // Por si lo mapeaste en el jwt.strategy
  sub?: string; // El valor original del payload
  username: string;
  role: string;
}

// 2. Le enseñamos a Express que nuestro request trae ese usuario específico
export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

export const GetUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    // Forzamos el tipado estricto en el request
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // TypeScript ahora sabe que "data" solo puede ser 'id', 'sub', 'username' o 'role'
    return data ? user[data] : user;
  },
);
