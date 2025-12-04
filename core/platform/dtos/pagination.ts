import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServerConfig } from '@server/config';
import { IsNotEmpty, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'This field is used for normal pagination',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'This field is used for infinite scroll',
  })
  @IsNumber()
  @IsOptional()
  lastItemId?: number;

  @ApiProperty({
    type: Number,
    example: 20,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(ServerConfig.get().PAGE_SIZE_MAX)
  pageSize: number;
}

export class PaginationMetadataResponseDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  total: number;
}

export class PaginationResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty({
    type: PaginationMetadataResponseDto,
  })
  pagination: PaginationMetadataResponseDto;
}
