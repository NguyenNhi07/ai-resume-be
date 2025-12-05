import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import {
  CompressionMiddleware,
  CookieParserMiddleware,
  CorrelationIdMiddleware,
  HelmetMiddleware,
  HttpLoggerMiddleware,
} from 'src/middleware';
import { AuthModule } from 'src/module/auth';
import { BaseModule } from 'src/module/base';
import { StorageModule } from 'src/module/storage';
import { SystemModule } from 'src/module/system/system.module';
import { UserModule } from 'src/module/user';
import { ResumeModule } from 'src/module/resume';

@Module({
  imports: [
    TerminusModule.forRoot(),
    ScheduleModule.forRoot(),
    DiscoveryModule,
    BaseModule,
    AuthModule,
    UserModule,
    SystemModule,
    StorageModule,
    ResumeModule,
    // Business logic module
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    HelmetMiddleware.configure({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    });

    consumer
      .apply(
        CorrelationIdMiddleware,
        HelmetMiddleware,
        CookieParserMiddleware,
        CompressionMiddleware,
      )
      .forRoutes('*');

    // logger
    consumer.apply(HttpLoggerMiddleware).exclude('(v[0-9]+)/auth/(.*)').forRoutes('*');

    // error-able middleware
    // consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
