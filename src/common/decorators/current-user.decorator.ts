import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../interfaces/common.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    
    return data ? user?.[data] : user;
  },
);

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as any;
    
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    // Try multiple ways to get user_id
    // 1. Direct property access
    let userId = user.user_id;
    
    // 2. If not found, try sub (from JWT payload)
    if (!userId) {
      userId = user.sub;
    }
    
    // 3. If still not found, try accessing as a getter (TypeORM entities sometimes use getters)
    if (!userId && typeof user.get === 'function') {
      try {
        userId = user.get('user_id');
      } catch (e) {
        // Ignore
      }
    }
    
    // 4. Last resort: check all properties
    if (!userId) {
      userId = (user as any).userId || (user as any).id;
    }
    
    // 5. If still not found, try to extract from JWT token directly
    if (!userId) {
      const authHeader = request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(token);
          userId = decoded?.sub;
        } catch (e) {
          // Ignore JWT decode errors
        }
      }
    }
    
    if (!userId) {
      throw new UnauthorizedException(
        `User ID not found. User object keys: ${user ? Object.keys(user).join(', ') : 'null'}`
      );
    }
    
    return userId;
  },
);

export const CurrentEstateId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-estate-id'] || request.query.estate_id;
  },
);
