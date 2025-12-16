import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { AsyncStorage } from '@server/async-storage';
import { ServerConfig } from '@server/config';
import { bcrypt } from '@server/libs/bcrypt';
import { ERROR_RESPONSE } from 'src/common/const';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import { USER_DEFAULT_SELECT } from 'src/module/user/user.const';
import { JwtTokenType } from './auth.enum';
import { JwtPayload, UserJwtPayload } from './auth.type';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  public async login(body: LoginBodyDto): Promise<LoginResponseDto> {
    const { email } = body;

    const user = await this.findUserOrThrow({ email });
    if (user.status !== UserStatus.Active) {
      throw new ServerException({
        ...ERROR_RESPONSE.FORBIDDEN_RESOURCE,
        message: `User is not working because current status is ${user.status}`,
      });
    }
    const isCorrectPass = await bcrypt.compare(body.password, user.password);
    if (!isCorrectPass) {
      throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    }

    return this.provideTokenCredential({
      userId: user.id,
      role: user.role,
    });
  }

  public async signup(body: SignupBodyDto): Promise<SignupResponseDto> {
    const { email, name, dob } = body;

    const existingUser = await this.databaseService.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      throw new ServerException(ERROR_RESPONSE.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(
      body.password,
      ServerConfig.get().BCRYPT_SALT_ROUNDS,
    );

    const newUser = await this.databaseService.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: name,
        lastName: '',
        fullName: name.trim(),
        dob,
        role: UserRole.Staff,
      },
      select: USER_DEFAULT_SELECT,
    });

    return this.provideTokenCredential({
      userId: newUser.id,
      role: newUser.role,
    });
  }

  public async refreshToken(user: UserJwtPayload): Promise<RefreshTokenResponseDto> {
    return this.provideTokenCredential({ ...user });
  }

  public async logout(): Promise<LogoutResponseDto> {
    // Stateless JWT: nothing to revoke on server for now.
    // If refresh tokens are stored in DB/Redis later, revoke them here.
    return {};
  }

  private async findUserOrThrow(where: Prisma.UserWhereInput) {
    const user = await this.databaseService.user.findFirst({
      where,
    });
    if (!user) throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    return user;
  }

  async forgetPassword(body: ForgetPasswordBodyDto): Promise<ForgetPasswordResponseDto> {
    // todo: wait for email module
    return undefined;
  }

  async changePassword(body: ChangePasswordBodyDto): Promise<ChangePasswordResponseDto> {
    const { email } = body;
    const id = AsyncStorage.get('userId') as number;
    const user = await this.findUserOrThrow({ id, email });

    const isCorrectPass = await bcrypt.compare(body.password, user.password);
    if (!isCorrectPass) {
      throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    }

    const newPassword = await bcrypt.hash(
      body.password,
      ServerConfig.get().BCRYPT_SALT_ROUNDS,
    );

    return this.databaseService.user.update({
      where: { email },
      data: {
        password: newPassword,
        temporaryPassword: null,
      },
      select: USER_DEFAULT_SELECT,
    });
  }

  // ****************************** private methods ******************************
  private async provideTokenCredential(payload: Partial<JwtPayload>) {
    const promises: Promise<string>[] = [
      this.jwtService.signAsync(
        { ...payload, type: JwtTokenType.AccessToken } as JwtPayload,
        { expiresIn: ServerConfig.get().JWT_ACCESS_EXPIRED },
      ),
      this.jwtService.signAsync(
        { ...payload, type: JwtTokenType.RefreshToken } as JwtPayload,
        { expiresIn: ServerConfig.get().JWT_REFRESH_EXPIRED },
      ),
    ];
    const [accessToken, refreshToken] = await Promise.all(promises);
    return { accessToken, refreshToken };
  }

  private async validateUser(payload: JwtPayload) {
    return this.databaseService.user.findFirst({ where: { id: payload.userId } });
  }
}
