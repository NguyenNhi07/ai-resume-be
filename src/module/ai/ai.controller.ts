import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleBaseAccessControl, SwaggerApiDocument, User } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import { AiService } from './ai.service';
import { OptimizeTextBodyDto, OptimizeTextResponseDto } from './dtos';

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
}

