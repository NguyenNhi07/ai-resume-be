/**
 * @see: ServerConfig.initialize() for extra config variables
 * @Note:
 * 1. If env is a number add "+" as prefix to convert
 **/
const MAIN_CONFIG = {
  // app
  SERVER_PORT: +process.env.SERVER_PORT,
  API_PREFIX: process.env.API_PREFIX,
  SWAGGER_ENDPOINT: process.env.SWAGGER_ENDPOINT,
  BCRYPT_SALT_ROUNDS: +process.env.BCRYPT_SALT_ROUNDS,
  THROTTLER_TTL: +process.env.THROTTLER_TTL,
  THROTTLER_LIMIT: +process.env.THROTTLER_LIMIT,
  HTTP_REQUEST_TIMEOUT: +process.env.HTTP_REQUEST_TIMEOUT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  TZ: process.env.TZ,
  PAGE_SIZE_MAX: +process.env.PAGE_SIZE_MAX,
  // jwt
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_EXPIRED: process.env.JWT_ACCESS_EXPIRED,
  JWT_REFRESH_EXPIRED: process.env.JWT_REFRESH_EXPIRED,
  // Google
  SMTP_GMAIL_USER: process.env.SMTP_GMAIL_USER,
  SMTP_GMAIL_PASS: process.env.SMTP_GMAIL_PASS,
  // Generic SMTP
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? +process.env.SMTP_PORT : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  // REDIS
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: +process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  // File
  DISK_STORAGE_PATH: process.env.DISK_STORAGE_PATH,
  EXECUTIVE_STORAGE_PATH: process.env.EXECUTIVE_STORAGE_PATH,
  CAMPAIGN_MEDIA_STORAGE_PATH: process.env.CAMPAIGN_MEDIA_STORAGE_PATH,
  LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH,
  BACKUP_PATH: process.env.DISK_STORAGE_PATH,
  // Prisma
  PRISMA_LOG_LEVEL: process.env.PRISMA_LOG_LEVEL?.split(','),
  // integrations
  PEOPLE_DATA_LAB_API_KEY: process.env.PEOPLE_DATA_LAB_API_KEY,
  // AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

Object.seal(MAIN_CONFIG);

export default MAIN_CONFIG;
