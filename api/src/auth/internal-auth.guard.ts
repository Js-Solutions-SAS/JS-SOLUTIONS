import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHmac, timingSafeEqual } from 'crypto';

import {
  extractRequestIp,
  isIpAllowed,
} from '../modules/shared/context/ip-allowlist.util';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  private verifyInternalHmac(input: {
    hmacSecret: string;
    signature: string;
    timestamp: string;
    body: unknown;
  }): boolean {
    if (!input.signature || !input.timestamp) {
      return false;
    }

    const issuedAtMs = Number(input.timestamp);
    if (!Number.isFinite(issuedAtMs)) {
      return false;
    }

    const maxSkewMs = Number(
      this.configService.get<string>('INTERNAL_HMAC_MAX_SKEW_MS', '300000'),
    );
    if (Math.abs(Date.now() - issuedAtMs) > maxSkewMs) {
      return false;
    }

    const serializedBody =
      typeof input.body === 'undefined' ? '' : JSON.stringify(input.body);
    const content = `${input.timestamp}.${serializedBody}`;
    const expected = createHmac('sha256', input.hmacSecret)
      .update(content)
      .digest('hex');

    const received = input.signature.replace(/^sha256=/i, '').trim();
    if (!received || received.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      body?: unknown;
      originalUrl?: string;
      url?: string;
      socket?: { remoteAddress?: string };
    }>();

    const requestUrl = String(request.originalUrl || request.url || '');
    const isInternalRoute = requestUrl.includes('/api/v1/internal/');

    if (isInternalRoute) {
      const allowlist = this.configService.get<string>(
        'INTERNAL_IP_ALLOWLIST',
        '',
      );
      if (allowlist.trim()) {
        const requestIp = extractRequestIp({
          forwardedFor: request.headers['x-forwarded-for'],
          remoteAddress: request.socket?.remoteAddress,
        });

        if (!isIpAllowed(requestIp, allowlist)) {
          throw new ForbiddenException('IP not allowed for internal routes.');
        }
      }
    }

    const expectedToken = this.configService.get<string>('API_INTERNAL_TOKEN');
    const authHeaderRaw = request.headers.authorization;
    const authHeader = Array.isArray(authHeaderRaw)
      ? authHeaderRaw[0]
      : authHeaderRaw || '';

    const hasBearer = authHeader.startsWith('Bearer ');

    if (expectedToken) {
      if (!hasBearer) {
        throw new UnauthorizedException('Missing bearer token.');
      }

      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token !== expectedToken) {
        throw new UnauthorizedException('Invalid bearer token.');
      }
    }

    if (isInternalRoute) {
      const hmacSecret =
        this.configService.get<string>('INTERNAL_HMAC_SECRET') || '';
      const requireHmac =
        String(
          this.configService.get<string>(
            'INTERNAL_REQUIRE_HMAC_FOR_INTERNAL',
            'true',
          ),
        ).toLowerCase() === 'true';

      if (hmacSecret.trim()) {
        const signatureRaw = request.headers['x-signature'];
        const timestampRaw = request.headers['x-timestamp'];
        const signature = Array.isArray(signatureRaw)
          ? signatureRaw[0]
          : signatureRaw || '';
        const timestamp = Array.isArray(timestampRaw)
          ? timestampRaw[0]
          : timestampRaw || '';

        const isValidSignature = this.verifyInternalHmac({
          hmacSecret,
          signature,
          timestamp,
          body: request.body || {},
        });

        if (!isValidSignature && requireHmac) {
          throw new UnauthorizedException('Invalid internal HMAC signature.');
        }
      } else if (requireHmac && !expectedToken) {
        throw new UnauthorizedException(
          'Internal routes require INTERNAL_HMAC_SECRET or API_INTERNAL_TOKEN.',
        );
      }
    }

    return true;
  }
}
