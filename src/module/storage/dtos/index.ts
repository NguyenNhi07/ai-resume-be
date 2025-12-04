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
  @PropertyDto({
    type: 'file',
    required: true,
    validated: true,
  })
  file: MulterFile;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  userId: number;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  imageWidth: number;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  imageHeight: number;
}
