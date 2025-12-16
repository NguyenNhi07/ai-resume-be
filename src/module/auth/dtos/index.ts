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

export class ForgetPasswordBodyDto {}

// ****************************** ChangePassword ******************************
export class ChangePasswordResponseDto {}

export class ChangePasswordBodyDto extends LoginBodyDto {}

// ******************************  RefreshToken ******************************
export class RefreshTokenResponseDto extends LoginResponseDto {}

// ******************************  Logout ******************************
export class LogoutResponseDto {}
