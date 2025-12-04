import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { ServerConfig } from '@server/config';
import { NodeEnv } from '@server/platform';
import { AccessRole } from 'src/common/enums';
import {
  EnvironmentLimit,
  RoleBaseAccessControl,
  SwaggerApiDocument,
} from 'src/decorator';
import { DatabaseService } from 'src/module/base/database';
import { TestNestjsRestfulPayloadBodyDto, TestNestjsRestfulPayloadQueryDto } from './dto';

@Controller({
  path: 'system',
  version: VERSION_NEUTRAL,
})
@ApiTags('System')
@RoleBaseAccessControl(AccessRole.Public)
export class SystemController {
  constructor(
    private readonly health: HealthCheckService,
    // private readonly http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get(`health/disk`)
  @HealthCheck()
  @ApiOperation({
    operationId: `diskHealthCheck`,
    summary: 'Api diskHealthCheck',
  })
  diskHealthCheck() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }

  @Get(`health/memory`)
  @HealthCheck()
  @ApiOperation({
    operationId: `memoryHealthCheck`,
    summary: 'Api memoryHealthCheck',
  })
  memoryHealthCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  @Get(`health/prisma`)
  @HealthCheck()
  @ApiOperation({
    operationId: `prismaHealthCheck`,
    summary: 'Api prismaHealthCheck',
  })
  prismaHealthCheck() {
    const timeout = ServerConfig.get().HTTP_REQUEST_TIMEOUT / 2;
    return this.health.check([
      () => this.prisma.pingCheck('prisma_connection', this.databaseService, { timeout }),
    ]);
  }

  @Post('test/nest/rest/payload')
  @HttpCode(HttpStatus.OK)
  @EnvironmentLimit([NodeEnv.Local, NodeEnv.Development])
  @SwaggerApiDocument({
    response: {
      status: HttpStatus.OK,
    },
    operation: {
      operationId: `testNestjsRestfulPayload`,
      summary: 'Api testNestjsRestfulPayload',
      description: `testNestjsRestfulPayload`,
    },
  })
  testNestjsRestfulPayload(
    @Query() query: TestNestjsRestfulPayloadQueryDto,
    @Body() body: TestNestjsRestfulPayloadBodyDto,
  ) {
    return { query, body };
  }
}
