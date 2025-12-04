export const SYSTEM_REGEXS = {
  USER_PASSWORD_SECURE: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,32}$/,
  USER_PASSWORD_SIMPLE: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/,
  PRISMA_DATABASE_URL: /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/,
};
