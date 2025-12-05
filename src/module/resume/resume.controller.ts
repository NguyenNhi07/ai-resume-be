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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessRole } from 'src/common/enums';
import { PaginationResponseDto } from '@server/platform/dtos';
import { RoleBaseAccessControl, SwaggerApiDocument } from 'src/decorator';
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
@RoleBaseAccessControl([])
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
    @Body() body: CreateResumeBodyDto,
  ): Promise<CreateResumeResponseDto> {
    return this.resumeService.createResume(body);
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
}
