import { MulterFile } from '@server/platform';
import { PropertyDto } from 'src/decorator';

// ****************************** Base LocalStorage response dto ******************************
export class LocalStorageResponseDto {
  @PropertyDto()
  id: number;

  @PropertyDto()
  filename: string;

  @PropertyDto()
  path: string;

  @PropertyDto()
  mimetype: string;

  @PropertyDto()
  size: number;

  @PropertyDto()
  originalname: string;

  @PropertyDto()
  encoding: string;

  @PropertyDto()
  destination: string;

  @PropertyDto()
  createdAt: Date;
}

export class UploadFileBodyDto {
  // Note: file is handled by @UploadedFile() decorator, not in body
  // So we don't validate it here to avoid validation errors
  file?: MulterFile;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  userId?: number;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  imageWidth?: number;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  imageHeight?: number;
}
