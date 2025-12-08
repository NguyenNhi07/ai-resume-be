import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_RESPONSE } from 'src/common/const';
import { parseOrderByFromQuery } from 'src/common/helpers/database';
import { validatePaginationQueryDto } from 'src/common/helpers/request';
import { PaginationResponseDto } from '@server/platform/dtos';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import {
  CreateResumeBodyDto,
  CreateResumeResponseDto,
  GetResumeDetailResponseDto,
  GetResumeListQueryDto,
  GetResumeListResponseDto,
  UpdateResumeBodyDto,
  UpdateResumeResponseDto,
} from './dtos';

@Injectable()
export class ResumeService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createResume(userId: number, body: CreateResumeBodyDto): Promise<CreateResumeResponseDto> {
    return this.databaseService.resume.create({
      data: { ...body, userId },
    });
  };

  async getResumeList(query: GetResumeListQueryDto): Promise<PaginationResponseDto<GetResumeListResponseDto>> {
    const { page, pageSize, take, skip } = validatePaginationQueryDto(query);
    
    const where: Prisma.ResumeWhereInput = {
      // ...(query.id && { id: query.id }),
      // ...(query.userId && { userId: query.userId }),
      // ...(query.avatar && { avatar: query.avatar }),
      // ...(query.name && { name: query.name }),
      // ...(query.dateOfBirth && { dateOfBirth: query.dateOfBirth }),
      // ...(query.gender && { gender: query.gender }),
      // ...(query.email && { email: query.email }),
      // ...(query.phoneNumber && { phoneNumber: query.phoneNumber }),
      // ...(query.address && { address: query.address }),
      // ...(query.profession && { profession: query.profession }),
      // ...(query.language && { language: query.language }),
      // // ...(query.website && { website: query.website }),
      // ...(query.professional && { professional: query.professional }),
      // ...(query.summary && { summary: query.summary }),
      // // ...(query.skills && { skills: query.skills }),
      // // ...(query.experiences && { experiences: query.experiences }),
      // // ...(query.educations && { educations: query.educations }),
      // // ...(query.projects && { projects: query.projects }),
      // ...(query.isPublic && { isPublic: query.isPublic }),
    };
    if (query.createdAtRangeStart || query.createdAtRangeEnd) {
      where.createdAt = {
        gte: query.createdAtRangeStart,
        lte: query.createdAtRangeEnd,
      };
    };

    const [data, total] = await Promise.all([
      this.databaseService.resume.findMany({
        where,
        take,
        skip,
        orderBy: parseOrderByFromQuery(query.orderBy),
        ...(query.lastItemId && { cursor: { id: query.lastItemId } }),
      }),
      this.databaseService.resume.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { data, pagination: { page, pageSize, total, totalPages } };
  }

  async getResumeDetail(id: number): Promise<GetResumeDetailResponseDto> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return resume;
  }

  async updateResume(id: number, body: UpdateResumeBodyDto): Promise<UpdateResumeResponseDto> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return this.databaseService.resume.update({
      where: { id },
      data: { ...body },
    });
  }

  async deleteResume(id: number) {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return this.databaseService.resume.delete({ where: { id } });
  }
}
