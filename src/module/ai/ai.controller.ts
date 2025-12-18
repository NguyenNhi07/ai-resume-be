import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleBaseAccessControl, SwaggerApiDocument } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import { AiService } from './ai.service';
import {
  OptimizeTextBodyDto,
  OptimizeTextResponseDto,
  ScoreResumeByJDBodyDto,
  ScoreResumeByJDResponseDto,
  CoverLetterBodyDto,
  CoverLetterResponseDto,
} from './dtos';

@Controller('ai')
@ApiTags('AI')
@UseGuards(AuthGuard)
@RoleBaseAccessControl(true)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('optimize-text')
  @SwaggerApiDocument({
    response: { type: OptimizeTextResponseDto },
    body: { type: OptimizeTextBodyDto, required: true },
    operation: {
      operationId: `optimizeText`,
      summary: `Api optimizeText - Optimize and improve text content`,
    },
  })
  async optimizeText(
    @Body() body: OptimizeTextBodyDto,
  ): Promise<OptimizeTextResponseDto> {
    return this.aiService.optimizeText(body.text);
  }

  @Post('score-resume-jd')
  @SwaggerApiDocument({
    response: { type: ScoreResumeByJDResponseDto },
    body: { type: ScoreResumeByJDBodyDto, required: true },
    operation: {
      operationId: `scoreResumeByJD`,
      summary: `Api scoreResumeByJD - Score resume against job description and suggest improvements`,
    },
  })
  async scoreResumeByJD(
    @Body() body: ScoreResumeByJDBodyDto,
  ): Promise<ScoreResumeByJDResponseDto> {
    return this.aiService.scoreResumeByJD(body.resumeText, body.jdText);
  }

  @Post('cover-letter')
  @SwaggerApiDocument({
    response: { type: CoverLetterResponseDto },
    body: { type: CoverLetterBodyDto, required: true },
    operation: {
      operationId: `generateCoverLetter`,
      summary: `Api generateCoverLetter - Generate cover letter from resume & JD`,
    },
  })
  async generateCoverLetter(
    @Body() body: CoverLetterBodyDto,
  ): Promise<CoverLetterResponseDto> {
    return this.aiService.generateCoverLetter(body.resumeText, body.jdText, body.type);
  }
}

