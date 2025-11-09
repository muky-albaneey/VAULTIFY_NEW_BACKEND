import { Injectable, ExecutionContext, CallHandler } from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { Observable } from "rxjs";

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

    if (["POST", "PUT", "DELETE"].includes(request.method)) {
      console.log(
        `Invalidating all cache data due to ${request.method} request`
      );
      await this.cacheManager.del("*");
    }

    const cachedResponse = await this.cacheManager.get(key);

    if (cachedResponse) {
      return cachedResponse;
    }

    return next
      .handle()
      .toPromise()
      .then(async (response) => {
        await this.cacheManager.set(key, response, { ttl: 3600 });
        return response;
      });
  }

  private getCacheKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();

    return `${request.method}:${request.originalUrl}`;
  }
}
