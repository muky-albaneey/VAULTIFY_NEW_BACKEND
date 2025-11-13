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

    // Skip caching for POST, PUT, DELETE requests (especially auth endpoints)
    if (["POST", "PUT", "DELETE"].includes(request.method)) {
      console.log(
        `Skipping cache for ${request.method} request to ${request.originalUrl}`
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

    // For GET requests, check cache
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
