import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { extractRequestIp } from '../modules/shared/context/ip-allowlist.util';

interface BucketState {
  count: number;
  resetAt: number;
}

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, BucketState>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      socket?: { remoteAddress?: string };
      route?: { path?: string };
      method?: string;
    }>();

    const ip = extractRequestIp({
      forwardedFor: request.headers['x-forwarded-for'],
      remoteAddress: request.socket?.remoteAddress,
    });

    const route = request.route?.path || 'unknown-route';
    const method = request.method || 'GET';

    const key = `${ip}:${method}:${route}`;
    const now = Date.now();

    const windowMs = Number(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || 60000);
    const maxHits = Number(process.env.PUBLIC_RATE_LIMIT_MAX_HITS || 60);

    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (current.count >= maxHits) {
      throw new HttpException(
        'Public API rate limit exceeded.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    this.buckets.set(key, current);

    return true;
  }
}
