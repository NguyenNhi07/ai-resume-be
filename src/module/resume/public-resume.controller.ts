import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SwaggerApiDocument } from 'src/decorator';
import { ResumeService } from './resume.service';
import { GetResumeDetailResponseDto } from './dtos';

@Controller('public/resume')
@ApiTags('Public Resume')
export class PublicResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get(':id')
  @SwaggerApiDocument({
    response: { type: GetResumeDetailResponseDto },
    operation: {
      operationId: `getPublicResumeDetail`,
      summary: `Api getPublicResumeDetail`,
    },
    extra: { isPublic: true },
  })
  async getPublicResumeDetail(
    @Param('id') id: number,
  ): Promise<GetResumeDetailResponseDto> {
    return this.resumeService.getPublicResume(id);
  }
}


