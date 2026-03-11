import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const expectedToken = this.configService.get<string>('API_INTERNAL_TOKEN');

    if (!expectedToken) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const authHeaderRaw = request.headers.authorization;
    const authHeader = Array.isArray(authHeaderRaw)
      ? authHeaderRaw[0]
      : authHeaderRaw || '';

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token !== expectedToken) {
      throw new UnauthorizedException('Invalid bearer token.');
    }

    return true;
  }
}
