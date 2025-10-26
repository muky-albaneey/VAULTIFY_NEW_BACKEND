import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const ESTATE_SCOPED_KEY = 'estate_scoped';
export const EstateScoped = () => SetMetadata(ESTATE_SCOPED_KEY, true);

export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (limit: number, ttl: number) => 
  SetMetadata(RATE_LIMIT_KEY, { limit, ttl });

export const IDEMPOTENCY_KEY = 'idempotency';
export const Idempotent = () => SetMetadata(IDEMPOTENCY_KEY, true);
