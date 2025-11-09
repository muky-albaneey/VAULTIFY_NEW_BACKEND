import { Module } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

@Module({
  imports: [
    NestCacheModule.register({
      store: redisStore,
      host: "127.0.0.1",
      port: 6379,
      password: "vaultiy-redis",
      ttl: 60 * 60, // Cache TTL in seconds (1 hour)
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
