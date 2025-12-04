import { RedisModule as NestjsRedisModule } from '@nestjs-modules/ioredis';
import { Global, Module } from '@nestjs/common';
import { ServerConfig } from '@server/config';
import { RedisService } from './redis.service';

@Module({
  imports: [
    NestjsRedisModule.forRoot({
      type: 'single',
      options: { ...ServerConfig.getRedisCredentials() },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
