import { Injectable } from '@nestjs/common';
import { ServerConfig } from '@server/config';
import { createReadStream, promises } from 'fs';
import { join } from 'path';
import { ERROR_RESPONSE } from 'src/common/const';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import { LocalStorageResponseDto, UploadFileBodyDto } from './dtos';

@Injectable()
export class LocalStorageService {
  constructor(private readonly databaseService: DatabaseService) {}

  async uploadLocalFile(body: UploadFileBodyDto): Promise<LocalStorageResponseDto> {
    return this.databaseService.storage.create({
      data: {
        userId: body.userId,
        filename: body.file.filename,
        path: body.file.path,
        mimetype: body.file.mimetype,
        size: body.file.size,
        originalname: body.file.originalname,
        encoding: body.file.encoding,
        destination: body.file.destination,
      },
    });
  }

  async getLocalFile(filename: string) {
    const imagePath = join(ServerConfig.get().LOCAL_STORAGE_PATH, filename);

    const fileExists = await promises
      .access(imagePath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }

    const stats = await promises.stat(imagePath);
    const fileSize = stats.size;

    const file = await this.databaseService.storage.findFirst({
      where: { filename },
    });

    const mimeType = file.mimetype || 'application/octet-stream';

    const fileStream = createReadStream(imagePath);

    return { fileStream, fileSize, mimeType };
  }
}
