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
}
