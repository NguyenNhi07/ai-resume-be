import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { AsyncStorage } from '@server/async-storage';
import { ServerConfig } from '@server/config';
import { ServerLogger } from '@server/logger';
import nodemailer from 'nodemailer';
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
  ResetPasswordBodyDto,
  ResetPasswordResponseDto,
  RefreshTokenResponseDto,
  SignupBodyDto,
  SignupResponseDto,
  LogoutResponseDto,
  VerifyOtpBodyDto,
  VerifyOtpResponseDto,
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
    const { email, newPassword } = body;

    const user = await this.databaseService.user.findFirst({
      where: { email, isDeleted: false },
    });

    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(
      rawOtp,
      ServerConfig.get().BCRYPT_SALT_ROUNDS,
    );

    // Hash new password for later apply
    const hashedNewPassword = await bcrypt.hash(
      newPassword,
      ServerConfig.get().BCRYPT_SALT_ROUNDS,
    );

    const expiredAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.databaseService.user.update({
      where: { id: user.id },
      // Cast to any to avoid type issues until Prisma generate runs
      data: {
        resetOtpHash: hashedOtp,
        resetOtpExpiredAt: expiredAt,
        resetNewPassword: hashedNewPassword,
        forceResetPassword: true,
      } as any,
    });

    await this.sendOtpEmail({
      to: email,
      otp: rawOtp,
    });

    return {};
  }

  async resetPassword(body: ResetPasswordBodyDto): Promise<ResetPasswordResponseDto> {
    // Deprecated in new flow; keeping for backward compatibility
    // Expect token + newPassword; verify against resetOtpHash
    const { email, token, newPassword } = body;

    const user = await this.databaseService.user.findFirst({
      where: { email, isDeleted: false },
    });
    const userWithReset = user as any;
    if (!userWithReset || !userWithReset.resetOtpHash) {
      throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    }
    if (userWithReset.resetOtpExpiredAt && userWithReset.resetOtpExpiredAt < new Date()) {
      throw new ServerException(ERROR_RESPONSE.REQUEST_TIMEOUT);
    }

    const isValidToken = await bcrypt.compare(token, userWithReset.resetOtpHash);
    if (!isValidToken) {
      throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      ServerConfig.get().BCRYPT_SALT_ROUNDS,
    );

    await this.databaseService.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtpHash: null,
        resetOtpExpiredAt: null,
        resetNewPassword: null,
        forceResetPassword: false,
      } as any,
    });

    return {};
  }

  async verifyOtp(body: VerifyOtpBodyDto): Promise<VerifyOtpResponseDto> {
    const { email, otp } = body;

    const user = await this.databaseService.user.findFirst({
      where: { email, isDeleted: false },
    });
    const userWithReset = user as any;
    if (!userWithReset || !userWithReset.resetOtpHash || !userWithReset.resetNewPassword) {
      throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    }
    if (userWithReset.resetOtpExpiredAt && userWithReset.resetOtpExpiredAt < new Date()) {
      throw new ServerException(ERROR_RESPONSE.REQUEST_TIMEOUT);
    }

    const isValid = await bcrypt.compare(otp, userWithReset.resetOtpHash);
    if (!isValid) {
      throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    }

    // Apply new password that user submitted in forgetPassword
    await this.databaseService.user.update({
      where: { id: user.id },
      data: {
        password: userWithReset.resetNewPassword,
        resetOtpHash: null,
        resetOtpExpiredAt: null,
        resetNewPassword: null,
        forceResetPassword: false,
      } as any,
    });

    return {};
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

  // --------- private helpers ---------
  private async sendOtpEmail(params: { to: string; otp: string }) {
    const config = ServerConfig.get();
    const host = config.SMTP_HOST || config.SMTP_GMAIL_USER ? 'smtp.gmail.com' : undefined;
    const user = config.SMTP_USER || config.SMTP_GMAIL_USER;
    const pass = config.SMTP_PASS || config.SMTP_GMAIL_PASS;
    const from = config.SMTP_FROM || user;

    if (!host || !user || !pass || !from) {
      ServerLogger.warn({
        message: 'SMTP config missing, skip sending email',
        context: 'AuthService.sendOtpEmail',
        meta: { to: params.to },
      });
      // In dev, we log OTP to help testing
      ServerLogger.info({
        message: 'Password reset OTP (dev mode, email not sent)',
        context: 'AuthService.sendOtpEmail',
        meta: { to: params.to, otp: params.otp },
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: config.SMTP_PORT || 587,
      secure: (config.SMTP_PORT || 587) === 465,
      auth: { user, pass },
    });

    const mailOptions = {
      from,
      to: params.to,
      subject: 'Your password reset code',
      text: `Your OTP code is: ${params.otp}. It will expire in 15 minutes.`,
      html: `<p>Your OTP code is: <b>${params.otp}</b></p><p>This code expires in 15 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
  }
}
