import { NodeEnv } from '@server/platform';

const SERVER_CONFIG_DEFAULT = {
  // app
  SERVER_PORT: 3000,
  API_PREFIX: '/api',
  APP_VERSION: '0.0.1',
  APP_NAME: 'nestjs-boilerplate',
  SWAGGER_ENDPOINT: 'docs',
  BCRYPT_SALT_ROUNDS: 10,
  THROTTLER_TTL: 60000,
  THROTTLER_LIMIT: 100,
  HTTP_REQUEST_TIMEOUT: 5000,
  NODE_ENV: NodeEnv.Development,
  PAGE_SIZE_MAX: 100,
  // jwt
  JWT_SECRET: 'JWT_SECRET_DEFAULT_DO_NOT_USE_IN_PRODUCTION',
  JWT_ACCESS_EXPIRED: '3h',
  JWT_REFRESH_EXPIRED: '1y',
  // REDIS
  REDIS_HOST: `localhost`,
  REDIS_PORT: 6379,
  REDIS_PASSWORD: undefined,
  TZ: 'UTC',
  DISK_STORAGE_PATH: 'uploads',
  EXECUTIVE_STORAGE_PATH: 'uploads/executive',
  CAMPAIGN_MEDIA_STORAGE_PATH: 'uploads/campaign-media',
  LOCAL_STORAGE_PATH: 'uploads/local',
  BACKUP_PATH: 'prisma/backups',
  PRISMA_LOG_LEVEL: ['error', 'warn', 'info'],
};

Object.seal(SERVER_CONFIG_DEFAULT);

export default SERVER_CONFIG_DEFAULT;
