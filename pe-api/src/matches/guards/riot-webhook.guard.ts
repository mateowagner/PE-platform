// pe-api/src/matches/guards/riot-webhook.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class RiotWebhookGuard implements CanActivate {
  private readonly logger = new Logger(RiotWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = this.configService.get<string>('RIOT_WEBHOOK_SECRET');

    // En entornos locales de desarrollo donde no se configure el secret, emitir advertencia
    if (!secret) {
      this.logger.warn(
        'RIOT_WEBHOOK_SECRET no configurado en variables de entorno. Permitiendo bypass temporal.',
      );
      return true;
    }

    const signature =
      (request.headers['x-riot-signature'] as string) ||
      (request.headers['x-hub-signature-256'] as string);

    if (!signature) {
      throw new UnauthorizedException(
        'Cabecera de firma de seguridad faltante (x-riot-signature).',
      );
    }

    const rawPayload = JSON.stringify(request.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(
      signature.replace(/^sha256=/, ''),
      'utf8',
    );

    // Comparación segura en tiempo constante para prevenir Timing Attacks
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new ForbiddenException(
        'Firma criptográfica inválida: el payload no proviene de un origen autorizado.',
      );
    }

    return true;
  }
}
