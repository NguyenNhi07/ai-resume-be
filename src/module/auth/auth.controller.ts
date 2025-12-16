import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessRole } from 'src/common/enums';
import { RoleBaseAccessControl, SwaggerApiDocument, User } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import { RefreshTokenGuard } from 'src/guard/refresh-token.guard';
import { AuthService } from './auth.service';
import { UserJwtPayload } from './auth.type';
import {
  ChangePasswordBodyDto,
  ChangePasswordResponseDto,
  ForgetPasswordBodyDto,
  ForgetPasswordResponseDto,
  LoginBodyDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  SignupBodyDto,
  SignupResponseDto,
  LogoutResponseDto,
} from './dtos';

@Controller('auth')
@ApiTags('Auth')
@UseGuards(AuthGuard)
@RoleBaseAccessControl(AccessRole.Admin)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @SwaggerApiDocument({
    response: { type: LoginResponseDto },
    body: { type: LoginBodyDto, required: true },
    operation: {
      operationId: `login`,
      summary: `Api login`,
    },
  })
  @RoleBaseAccessControl(AccessRole.Public)
  async login(@Body() body: LoginBodyDto): Promise<LoginResponseDto> {
    return this.authService.login(body);
  }

  @Post('signup')
  @SwaggerApiDocument({
    response: { type: SignupResponseDto },
    body: { type: SignupBodyDto, required: true },
    operation: {
      operationId: `signup`,
      summary: `Api signup`,
    },
  })
  @RoleBaseAccessControl(AccessRole.Public)
  async signup(@Body() body: SignupBodyDto): Promise<SignupResponseDto> {
    return this.authService.signup(body);
  }

  @Post('forget-password')
  @SwaggerApiDocument({
    response: { type: ForgetPasswordResponseDto },
    body: { type: ForgetPasswordBodyDto, required: true },
    operation: {
      operationId: `forgetPassword`,
      summary: `Api forgetPassword`,
    },
  })
  @RoleBaseAccessControl(AccessRole.Public)
  async forgetPassword(
    @Body() body: ForgetPasswordBodyDto,
  ): Promise<ForgetPasswordResponseDto> {
    return this.authService.forgetPassword(body);
  }

  @Post('change-password')
  @SwaggerApiDocument({
    response: { type: ChangePasswordResponseDto },
    body: { type: ChangePasswordBodyDto, required: true },
    operation: {
      operationId: `changePassword`,
      summary: `Api changePassword`,
      description: `Change current account password`,
    },
  })
  @RoleBaseAccessControl(true)
  @ApiBearerAuth()
  async changePassword(
    @Body() body: ChangePasswordBodyDto,
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(body);
  }

  @Post('refresh-token')
  @SwaggerApiDocument({
    response: { type: RefreshTokenResponseDto },
    operation: {
      operationId: `refreshToken`,
      summary: `Api refreshToken`,
    },
  })
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  async refreshToken(
    @User() userPayload: UserJwtPayload,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(userPayload);
  }

  @Post('logout')
  @SwaggerApiDocument({
    response: { type: LogoutResponseDto },
    operation: {
      operationId: `logout`,
      summary: `Api logout`,
    },
  })
  @RoleBaseAccessControl(true)
  @ApiBearerAuth()
  async logout(): Promise<LogoutResponseDto> {
    return this.authService.logout();
  }
}
