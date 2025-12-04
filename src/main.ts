import { VersioningType } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ServerConfig } from '@server/config';
import { corsOptions } from '@server/cors';
import { ServerLogger } from '@server/logger';
import { PayloadValidationPipe } from '@server/pipe';
import { SWAGGER_CUSTOM_JS } from 'src/common/const/swagger';
import { HttpExceptionFilter } from 'src/exception/filter';
import { TimeoutInterceptor } from 'src/interceptor';
import { SystemService } from 'src/module/system';
import { AppModule } from './module/app.module';

/**
 * Note:
 * 1. Be careful with useGlobalFilters(), the filters order is not correct base on nestjs doc, but it seems to work
 **/
(async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const httpAdapter = app.get(HttpAdapterHost);
  const { APP_VERSION, APP_NAME, SERVER_PORT, SWAGGER_ENDPOINT, API_PREFIX, NODE_ENV } =
    ServerConfig.get();

  //
  app.set('query parser', 'extended'); // configure Express to use the extended parser (the default in Express v4)

  // security
  app.enableCors(corsOptions);

  // global resources
  app.useGlobalPipes(new PayloadValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter));
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalInterceptors(new TimeoutInterceptor());

  // versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // swagger documentation
  const appService = app.get(SystemService);
  await appService.injectCustomMetadataToSwaggerEndpoints();
  const config = new DocumentBuilder()
    .setTitle(`${APP_NAME} Apis Documentation`)
    .setVersion(APP_VERSION)
    .addBearerAuth()
    .setDescription(
      `The API description</br>**Number of endpoints:** ${appService.endpointCount}`,
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_ENDPOINT, app, document, {
    explorer: true,
    customSiteTitle: `${APP_NAME} ${NODE_ENV}`,
    swaggerOptions: { initOAuth: { appName: APP_NAME }, persistAuthorization: true },
    customJsStr: SWAGGER_CUSTOM_JS,
  });

  // start server
  await app.listen(SERVER_PORT);
  ServerLogger.info({
    context: `NestApplication.main`,
    message: `Application is ready. View Swagger at http://localhost:${SERVER_PORT}/${SWAGGER_ENDPOINT}`,
  });
})();
