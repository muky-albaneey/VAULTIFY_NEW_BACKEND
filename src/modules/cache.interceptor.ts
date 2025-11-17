import { Injectable, ExecutionContext, CallHandler } from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";

@Injectable()
export class CacheCustomInterceptor extends CacheInterceptor {
  public cacheManager: any;
  public reflector: any;

  constructor(@Inject("CACHE_MANAGER") cacheManager: any, reflector: any) {
    super(cacheManager, reflector);
    this.cacheManager = cacheManager;
    this.reflector = reflector;
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const key = this.getCacheKey(context);
    const url = request.originalUrl || request.url;

    // Skip caching for POST, PUT, DELETE requests (especially auth endpoints)
    if (["POST", "PUT", "DELETE"].includes(request.method)) {
      console.log(
        `Skipping cache for ${request.method} request to ${url}`
      );
      // Invalidate cache and don't cache the response
      try {
        await this.cacheManager.del("*");
      } catch (error) {
        // Ignore cache deletion errors
      }
      // Return response without caching
      return next.handle();
    }

    // Skip caching for GET requests that return user profile data
    // These endpoints should always return fresh data to avoid stale profile information
    const profileEndpoints = [
      '/users/me',
      '/users/me/',
      '/wallets/me',
      '/wallets/me/',
      '/subscriptions/me',
      '/subscriptions/me/',
      '/subscriptions/me/active',
      '/alerts/me',
      '/alerts/me/',
      '/reports/me',
      '/reports/me/',
      '/bank-service-charges/me',
      '/bank-service-charges/me/',
      '/announcements/me',
      '/announcements/me/',
    ];

    // Check if this is a profile-related endpoint
    const isProfileEndpoint = profileEndpoints.some(endpoint => 
      url.includes(endpoint) || url.startsWith(endpoint)
    );

    // Also skip caching for GET /users/:id (user profile by ID)
    const isUserProfileById = /^\/users\/[^\/]+$/.test(url.split('?')[0]) && 
                              !url.includes('/users/estate') && 
                              !url.includes('/users/search');

    if (isProfileEndpoint || isUserProfileById) {
      console.log(
        `Skipping cache for profile GET request to ${url}`
      );
      // Invalidate any cached profile data
      try {
        await this.cacheManager.del("*");
      } catch (error) {
        // Ignore cache deletion errors
      }
      // Return response without caching
      return next.handle();
    }

    // For other GET requests, check cache
    const cachedResponse = await this.cacheManager.get(key);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Cache GET responses
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(key, response, { ttl: 3600 });
      })
    );
  }

  private getCacheKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();

    return `${request.method}:${request.originalUrl}`;
  }
}
