import { PropertyDto } from 'src/decorator';

// ****************************** Login ******************************
export class LoginResponseDto {
  @PropertyDto()
  accessToken: string;

  @PropertyDto()
  refreshToken: string;
}

export class LoginBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'example@email.com',
  })
  email: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Admin@001',
  })
  password: string;
}

// ****************************** Signup ******************************
export class SignupResponseDto {
  @PropertyDto()
  accessToken: string;

  @PropertyDto()
  refreshToken: string;
}

export class SignupBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'example@email.com',
  })
  email: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Admin@001',
  })
  password: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'John Doe',
  })
  name: string;

  @PropertyDto({
    type: Date,
    required: false,
    validated: true,
  })
  dob: Date;
}

// ****************************** ForgetPassword ******************************
export class ForgetPasswordResponseDto {}

export class ForgetPasswordBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'example@email.com',
  })
  email: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'NewSecurePassword@123',
  })
  newPassword: string;
}

// ****************************** ResetPassword ******************************
export class ResetPasswordResponseDto {}

export class ResetPasswordBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  email: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: '6-digit or random token sent via email',
  })
  token: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'NewSecurePassword@123',
  })
  newPassword: string;
}

// ****************************** VerifyOtp ******************************
export class VerifyOtpResponseDto {}

export class VerifyOtpBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  email: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: '6-digit or random token sent via email',
  })
  otp: string;
}

// ****************************** ChangePassword ******************************
export class ChangePasswordResponseDto {}

export class ChangePasswordBodyDto extends LoginBodyDto {}

// ******************************  RefreshToken ******************************
export class RefreshTokenResponseDto extends LoginResponseDto {}

// ******************************  Logout ******************************
export class LogoutResponseDto {}
