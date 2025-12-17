import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServerConfig } from '@server/config';
import { bcrypt } from '@server/libs/bcrypt';
import { PaginationResponseDto } from '@server/platform/dtos';
import { ERROR_RESPONSE } from 'src/common/const';
import { validatePaginationQueryDto } from 'src/common/helpers/request';
import { generateRandomString } from 'src/common/helpers/string';
import { getCurrentDate } from 'src/common/helpers/time';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import {
  CreateUserBodyDto,
  CreateUserResponseDto,
  GetUserDetailResponseDto,
  GetUserListQueryDto,
  GetUserListResponseDto,
  UpdateUserBodyDto,
  UpdateUserResponseDto,
  UpdateMyProfileBodyDto,
  ChangePasswordBodyDto,
} from './dtos';
import { USER_DEFAULT_SELECT_BY_ADMIN } from './user.const';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(body: CreateUserBodyDto): Promise<CreateUserResponseDto> {
    const user = await this.databaseService.user.findFirst({
      where: { email: body.email },
    });
    if (user) {
      throw new ServerException(ERROR_RESPONSE.USER_ALREADY_EXISTED);
    }

    const { BCRYPT_SALT_ROUNDS } = ServerConfig.get();
    const temporaryPassword = generateRandomString(8);
    const password = await bcrypt.hash(temporaryPassword, BCRYPT_SALT_ROUNDS);

    return this.databaseService.user.create({
      data: {
        ...body,
        fullName: `${body.firstName} ${body.lastName}`,
        password,
        temporaryPassword,
        forceResetPassword: true,
      },
      select: { ...USER_DEFAULT_SELECT_BY_ADMIN, temporaryPassword: true },
    });
  }

  async getUserList(
    query: GetUserListQueryDto,
  ): Promise<PaginationResponseDto<GetUserListResponseDto>> {
    const { page, pageSize, take, skip } = validatePaginationQueryDto(query);

    const where: Prisma.UserWhereInput = {
      ...(query.id && { id: query.id }),
      ...(query.email && { email: query.email }),
      ...(query.fullName && { fullName: query.fullName }),
      ...(query.phoneNumber && { phoneNumber: query.phoneNumber }),
      ...(query.status && { status: query.status }),
      ...(query.role && { role: query.role }),
      ...(query.gender && { gender: query.gender }),
      ...(query.address && { address: query.address }),
      ...(query.imageLink && { imageLink: query.imageLink }),
      ...(query.language && { language: query.language }),
    };
    if (query.dobRangeStart || query.dobRangeEnd) {
      where.dob = {
        gte: query.dobRangeStart,
        lte: query.dobRangeEnd,
      };
    }
    if (query.lastActiveRangeStart || query.lastActiveRangeEnd) {
      where.lastActive = {
        gte: query.lastActiveRangeStart,
        lte: query.lastActiveRangeEnd,
      };
    }

    const [data, total] = await Promise.all([
      this.databaseService.user.findMany({
        where,
        take,
        skip,
        ...(query.lastItemId && { cursor: { id: query.lastItemId } }),
        select: USER_DEFAULT_SELECT_BY_ADMIN,
      }),
      this.databaseService.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { data, pagination: { page, pageSize, total, totalPages } };
  }

  async getUserDetail(id: number): Promise<GetUserDetailResponseDto> {
    const user = await this.databaseService.user.findFirst({
      where: { id },
      select: {
        ...USER_DEFAULT_SELECT_BY_ADMIN,
        temporaryPassword: true,
      },
    });
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }
    await this.databaseService.user.update({
      where: { id },
      data: { lastActive: getCurrentDate() },
    });
    return { ...user, isFirstTimeLogin: !user.lastActive };
  }

  async updateUser(id: number, body: UpdateUserBodyDto): Promise<UpdateUserResponseDto> {
    const user = await this.databaseService.user.findFirst({
      where: { id },
      select: USER_DEFAULT_SELECT_BY_ADMIN,
    });
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }
    return this.databaseService.user.update({
      where: { id },
      data: { ...body },
    });
  }

  async deleteUser(id: number): Promise<any> {
    const user = await this.databaseService.user.findFirst({ where: { id } });
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }
    return this.databaseService.user.delete({ where: { id } });
  }

  async updateMyProfile(userId: number, body: UpdateMyProfileBodyDto): Promise<GetUserDetailResponseDto> {
    const user = await this.databaseService.user.findFirst({
      where: { id: userId },
    });
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    const data: Prisma.UserUpdateInput = {};
    if (body.name !== undefined) {
      data.fullName = body.name;
    }
    if (body.email !== undefined) {
      data.email = body.email;
    }
    if (body.dateOfBirth !== undefined) {
      data.dob = body.dateOfBirth;
    }
    if (body.phoneNumber !== undefined) {
      data.phoneNumber = body.phoneNumber;
    }
    if (body.gender !== undefined) {
      // cast string from FE to enum
      data.gender = body.gender as any;
    }
    if (body.profession !== undefined) {
      data.profession = body.profession;
    }
    if (body.imageLink !== undefined) {
      data.imageLink = body.imageLink;
    }

    const updated = await this.databaseService.user.update({
      where: { id: userId },
      data,
      select: {
        ...USER_DEFAULT_SELECT_BY_ADMIN,
        temporaryPassword: true,
      },
    });

    return {
      ...updated,
      isFirstTimeLogin: !updated.lastActive,
    };
  }

  async changePassword(userId: number, body: ChangePasswordBodyDto): Promise<void> {
    const user = await this.databaseService.user.findFirst({
      where: { id: userId },
    });
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    const isCorrectPass = await bcrypt.compare(body.oldPassword, user.password);
    if (!isCorrectPass) {
      throw new ServerException(ERROR_RESPONSE.OLD_PASSWORD_INCORRECT);
    }

    const { BCRYPT_SALT_ROUNDS } = ServerConfig.get();
    const newPasswordHashed = await bcrypt.hash(body.newPassword, BCRYPT_SALT_ROUNDS);

    await this.databaseService.user.update({
      where: { id: userId },
      data: {
        password: newPasswordHashed,
        temporaryPassword: null,
        forceResetPassword: false,
      },
    });
  }
}
