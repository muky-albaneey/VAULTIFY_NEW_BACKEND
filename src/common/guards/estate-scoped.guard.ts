import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ESTATE_SCOPED_KEY } from '../decorators/custom.decorators';

@Injectable()
export class EstateScopedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isEstateScoped = this.reflector.getAllAndOverride<boolean>(ESTATE_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isEstateScoped) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const estateId = request.headers['x-estate-id'] || request.query.estate_id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!estateId) {
      throw new ForbiddenException('Estate ID required');
    }

    // Add estate validation logic here if needed
    request.estateId = estateId;
    
    return true;
  }
}
