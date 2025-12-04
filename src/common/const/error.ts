import { HttpStatus } from '@nestjs/common';

export const ERROR_RESPONSE = {
  SOMETHING_WENT_WRONG: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: -1,
    message: `Oops, something went wrong`,
  },
  UNAUTHORIZED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 1,
    message: `Unauthorized`,
  },
  BAD_REQUEST: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 2,
    message: `Bad Request`,
  },
  REQUEST_PAYLOAD_VALIDATE_ERROR: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: 3,
    message: `Validate request payload error`,
  },
  USER_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 4,
    message: `This user is not exist.`,
  },
  EMAIL_ALREADY_TAKEN: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 5,
    message: `This email is not available`,
  },
  INVALID_REFRESH_TOKEN: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 6,
    message: `Invalid refresh token`,
  },
  INVALID_REFRESH_TOKEN_USAGE: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 7,
    message: `refreshToken can not be use as accessToken`,
  },
  INVALID_CREDENTIALS: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 8,
    message: `Invalid credentials`,
  },
  INVALID_IMAGE_EXTENSION: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: 9,
    message: `Invalid image extension`,
  },
  TOKEN_VERIFY_ERROR: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 10,
    message: `Your token can not be verified`,
  },
  ROLE_ACCESS_DENIED: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 11,
    message: 'Role access denied',
  },
  ACCESS_TOKEN_EXPIRED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 12,
    message: `Access token expired`,
  },
  USER_ALREADY_EXISTED: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 13,
    message: `Username or email is already exist`,
  },
  PASSWORD_NOT_SECURE: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 14,
    message: `Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 8-32 characters.`,
  },
  USER_ALREADY_VERIFIED: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 15,
    message: `User already verified before.`,
  },
  VERIFY_CODE_MISMATCH: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 16,
    message: `Verify code mismatch.`,
  },
  USER_MUST_RESET_PASSWORD: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 17,
    message: `This user must reset password for security reason.`,
  },
  USER_DID_NOT_VERIFIED: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 18,
    message: `This user must verify before use.`,
  },
  TOO_MANY_REQUEST: {
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    errorCode: 19,
    message: `Too many requests`,
  },
  FORBIDDEN_RESOURCE: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 20,
    message: `Forbidden resource`,
  },
  UNPROCESSABLE_ENTITY: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: 21,
    message: `Unprocessable entity`,
  },
  REQUEST_TIMEOUT: {
    statusCode: HttpStatus.REQUEST_TIMEOUT,
    errorCode: 22,
    message: `Request timeout`,
  },
  RESOURCE_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 23,
    message: `RESOURCE_NOT_FOUND`,
  },
  INVALID_FILES: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 24,
    message: `Invalid files`,
  },
  INTEGRATION_SERVICE_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 25,
    message: `Integration service error`,
  },
  MICROSERVICES_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 26,
    message: `Microservice error`,
  },
  USER_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 27,
    message: `User already exists`,
  },
  RESOURCE_FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 28,
    message: `Resource forbidden`,
  },
  /*------------------------------ trampol1nes ------------------------------*/
  INVALID_HEADERS_FORMAT_EXECUTIVE_PERSON: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 1000,
    message: `Invalid headers format. Please ensure the headers matching the CSV template`,
  },
  UPLOAD_PERSON_MAX_FILE_SIZE: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 1001,
    message: `File size exceeds the 100MB limit. Please upload a smaller file`,
  },
  UPLOAD_PERSON_INVALID_FILE_FORMAT: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 1002,
    message: `Invalid file format. Please upload a CSV file`,
  },
};

Object.seal(ERROR_RESPONSE);

export { HttpStatus };
