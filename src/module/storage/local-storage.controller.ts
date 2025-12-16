import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ServerConfig } from '@server/config';
import { BodyContentType, MulterFile } from '@server/platform';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { AccessRole } from 'src/common/enums';
import { PublicApi, RoleBaseAccessControl, SwaggerApiDocument } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import { LocalStorageResponseDto, UploadFileBodyDto } from './dtos';
import { LocalStorageService } from './local-storage.service';

@Controller('storage/local')
@ApiTags('Local Storage')
@UseGuards(AuthGuard)
@RoleBaseAccessControl(true) // allow any authenticated user role
@ApiBearerAuth()
export class LocalStorageController {
  private static readonly storage = diskStorage({
    destination: ServerConfig.get().LOCAL_STORAGE_PATH,
  });

  constructor(private readonly localStorageService: LocalStorageService) {}

  @Post()
  @SwaggerApiDocument({
    response: {
      type: LocalStorageResponseDto,
    },
    body: { type: UploadFileBodyDto, required: true },
    contentType: [BodyContentType.MultipartFormData],
    operation: {
      operationId: `uploadLocalFile`,
      summary: `Api uploadLocalFile`,
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: LocalStorageController.storage,
    }),
  )
  async uploadLocalFile(
    @UploadedFile() file: MulterFile,
    @Body() body: UploadFileBodyDto,
  ): Promise<LocalStorageResponseDto> {
    return this.localStorageService.uploadLocalFile({ ...body, file });
  }

  @Get(':filename')
  @PublicApi()
  @SwaggerApiDocument({
    response: {
      type: StreamableFile,
      description: ``,
    },
    operation: {
      operationId: 'getLocalFile',
      summary: 'Api getLocalFile',
    },
  })
  async getImage(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mimeType, fileStream, fileSize } =
      await this.localStorageService.getLocalFile(filename);

    res.type(mimeType);
    res.set('Content-Disposition', `inline; filename="${filename}"`);
    res.set('Content-Length', String(fileSize));
    res.set('Cache-Control', 'max-age=3600');
    return new StreamableFile(fileStream);
  }
}
