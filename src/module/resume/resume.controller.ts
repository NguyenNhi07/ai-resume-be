import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AccessRole } from 'src/common/enums';
import { PaginationResponseDto } from '@server/platform/dtos';
import { RoleBaseAccessControl, SwaggerApiDocument, User } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import { ResumeService } from './resume.service';
import {
  CreateResumeBodyDto,
  CreateResumeResponseDto,
  GetResumeDetailResponseDto,
  GetResumeListQueryDto,
  GetResumeListResponseDto,
  UpdateResumeBodyDto,
  UpdateResumeResponseDto,
  CreateResumeScoreBodyDto,
  ResumeScoreResponseDto,
  GetResumeScoreListQueryDto,
  CreateJobApplicationBodyDto,
  UpdateJobApplicationBodyDto,
  JobApplicationResponseDto,
  GetJobApplicationListQueryDto,
} from './dtos';

@Controller('resume')
@ApiTags('Resume')
@UseGuards(AuthGuard)
@RoleBaseAccessControl(true)
@ApiBearerAuth()
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  @SwaggerApiDocument({
    response: { type: CreateResumeResponseDto },
    body: { type: CreateResumeBodyDto, required: true },
    operation: {
      operationId: `createResume`,
      summary: `Api createResume`,
    },
  })
  async createResume(
    @User('id') userId: number,
    @Body() body: CreateResumeBodyDto,
  ): Promise<CreateResumeResponseDto> {
    return this.resumeService.createResume(userId, body);
  }

  @Get()
  @SwaggerApiDocument({
    response: {
      type: GetResumeListResponseDto,
      isPagination: true,
    },
    operation: {
      operationId: `getResumeList`,
      summary: `Api getResumeList`,
    },
  })
  async getResumeList(
    @Query() query: GetResumeListQueryDto,
  ): Promise<PaginationResponseDto<GetResumeListResponseDto>> {
    return this.resumeService.getResumeList(query);
  }

  @Get('score')
  @SwaggerApiDocument({
    response: {
      type: ResumeScoreResponseDto,
      isPagination: true,
    },
    query: { type: GetResumeScoreListQueryDto, required: true },
    operation: {
      operationId: `getResumeScoreList`,
      summary: `Api getResumeScoreList - Get resume score history`,
    },
  })
  async getResumeScoreList(
    @User('id') userId: number,
    @Query() query: GetResumeScoreListQueryDto,
  ): Promise<PaginationResponseDto<ResumeScoreResponseDto>> {
    return this.resumeService.getResumeScoreList(userId, query.resumeId, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Post('job-application')
  @SwaggerApiDocument({
    response: { type: JobApplicationResponseDto },
    body: { type: CreateJobApplicationBodyDto, required: true },
    operation: {
      operationId: `createJobApplication`,
      summary: `Api createJobApplication - Create a new job application record`,
    },
  })
  async createJobApplication(
    @User('id') userId: number,
    @Body() body: CreateJobApplicationBodyDto,
  ): Promise<JobApplicationResponseDto> {
    return this.resumeService.createJobApplication(userId, body);
  }

  @Get('job-application')
  @SwaggerApiDocument({
    response: { type: JobApplicationResponseDto, isPagination: true },
    query: { type: GetJobApplicationListQueryDto },
    operation: {
      operationId: `getJobApplicationList`,
      summary: `Api getJobApplicationList - Get list of job applications for a resume`,
    },
  })
  async getJobApplicationList(
    @User('id') userId: number,
    @Query() query: GetJobApplicationListQueryDto,
  ) {
    return this.resumeService.getJobApplicationList(query);
  }

  @Put('job-application/:id')
  @SwaggerApiDocument({
    response: { type: JobApplicationResponseDto },
    body: { type: UpdateJobApplicationBodyDto, required: true },
    operation: {
      operationId: `updateJobApplication`,
      summary: `Api updateJobApplication - Update a job application`,
    },
  })
  async updateJobApplication(
    @User('id') userId: number,
    @Param('id') id: string,
    @Body() body: UpdateJobApplicationBodyDto,
  ): Promise<JobApplicationResponseDto> {
    return this.resumeService.updateJobApplication(userId, Number(id), body);
  }

  @Delete('job-application/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SwaggerApiDocument({
    response: { status: HttpStatus.NO_CONTENT },
    operation: {
      operationId: `deleteJobApplication`,
      summary: `Api deleteJobApplication - Delete a job application`,
    },
  })
  async deleteJobApplication(
    @User('id') userId: number,
    @Param('id') id: string,
  ): Promise<void> {
    return this.resumeService.deleteJobApplication(userId, Number(id));
  }

  @Get(':id')
  @SwaggerApiDocument({
    response: { type: GetResumeDetailResponseDto },
    operation: {
      operationId: `getResumeDetail`,
      summary: `Api getResumeDetail`,
    },
  })
  async getResumeDetail(
    @Param('id') id: number,
  ): Promise<GetResumeDetailResponseDto> {
    return this.resumeService.getResumeDetail(id);
  }

  @Put(':id')
  @SwaggerApiDocument({
    response: { type: UpdateResumeResponseDto },
    body: { type: UpdateResumeBodyDto, required: true },
    operation: {
      operationId: `updateResume`,
      summary: `Api updateResume`,
    },
  })
  async updateResume(
    @Param('id') id: number,
    @Body() body: UpdateResumeBodyDto,
  ): Promise<UpdateResumeResponseDto> {
    return this.resumeService.updateResume(id, body);
  }

  @Put(':id/visibility')
  @SwaggerApiDocument({
    response: { type: UpdateResumeResponseDto },
    body: {
      type: UpdateResumeBodyDto,
      required: true,
    },
    operation: {
      operationId: `updateResumeVisibility`,
      summary: `Api updateResumeVisibility`,
    },
  })
  async updateResumeVisibility(
    @Param('id') id: number,
    @Body('isPublic') isPublic: boolean,
  ): Promise<UpdateResumeResponseDto> {
    return this.resumeService.setResumeVisibility(id, isPublic);
  }

  @Delete(':id')
  @SwaggerApiDocument({
    response: { status: HttpStatus.NO_CONTENT },
    operation: {
      operationId: `deleteResume`,
      summary: `Api deleteResume`,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteResume(@Param('id') id: number): Promise<void> {
    await this.resumeService.deleteResume(id);
  }

  @Get(':id/pdf')
  @SwaggerApiDocument({
    response: {
      type: StreamableFile,
      description: 'Resume PDF file',
    },
    operation: {
      operationId: `downloadResumePdf`,
      summary: `Api downloadResumePdf`,
    },
  })
  async downloadResumePdf(
    @Param('id') id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.resumeService.exportResumePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="resume-${id}.pdf"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('score')
  @SwaggerApiDocument({
    response: { type: ResumeScoreResponseDto },
    body: { type: CreateResumeScoreBodyDto, required: true },
    operation: {
      operationId: `createResumeScore`,
      summary: `Api createResumeScore - Save resume score history`,
    },
  })
  async createResumeScore(
    @User('id') userId: number,
    @Body() body: CreateResumeScoreBodyDto,
  ): Promise<ResumeScoreResponseDto> {
    return this.resumeService.createResumeScore(userId, body);
  }
}
