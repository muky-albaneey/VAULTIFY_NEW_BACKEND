import { Injectable, CanActivate, ExecutionContext, TooManyRequestsException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY } from './custom.decorators';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.getAllAndOverride<{ limit: number; ttl: number }>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const clientId = this.getClientId(request);
    const now = Date.now();
    const { limit, ttl } = rateLimitConfig;

    const clientData = this.requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      this.requestCounts.set(clientId, { count: 1, resetTime: now + ttl * 1000 });
      return true;
    }

    if (clientData.count >= limit) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    clientData.count++;
    return true;
  }

  private getClientId(request: any): string {
    return request.ip || request.connection.remoteAddress || 'unknown';
  }
}
