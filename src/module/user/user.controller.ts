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
import { PaginationResponseDto } from '@server/platform/dtos';
import { AccessRole } from 'src/common/enums';
import { RoleBaseAccessControl, SwaggerApiDocument, User } from 'src/decorator';
import { AuthGuard } from 'src/guard';
import {
  CreateUserBodyDto,
  CreateUserResponseDto,
  GetUserDetailResponseDto,
  GetUserListQueryDto,
  GetUserListResponseDto,
  UpdateUserBodyDto,
  UpdateUserResponseDto,
} from './dtos';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('User')
@UseGuards(AuthGuard)
@RoleBaseAccessControl([AccessRole.Admin])
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @SwaggerApiDocument({
    response: {
      type: CreateUserResponseDto,
    },
    body: { type: CreateUserBodyDto, required: true },
    operation: {
      operationId: `createUser`,
      summary: `Api createUser`,
    },
  })
  async createUser(@Body() body: CreateUserBodyDto): Promise<CreateUserResponseDto> {
    return this.userService.createUser(body);
  }

  @Get()
  @SwaggerApiDocument({
    response: {
      type: GetUserListResponseDto,
      isPagination: true,
    },
    operation: {
      operationId: `getUserList`,
      summary: `Api getUserList`,
    },
  })
  async getUserList(
    @Query() query: GetUserListQueryDto,
  ): Promise<PaginationResponseDto<GetUserListResponseDto>> {
    return this.userService.getUserList(query);
  }

  @Get('me')
  @SwaggerApiDocument({
    response: {
      type: GetUserDetailResponseDto,
    },
    operation: {
      operationId: `getMyInformation`,
      summary: `Api getMyInformation`,
    },
  })
  @RoleBaseAccessControl(true)
  async getMyInformation(@User('id') id: number): Promise<GetUserDetailResponseDto> {
    return this.userService.getUserDetail(id);
  }

  @Get(':id')
  @SwaggerApiDocument({
    response: {
      type: GetUserDetailResponseDto,
    },
    operation: {
      operationId: `getUserDetail`,
      summary: `Api getUserDetail`,
    },
  })
  async getUserDetail(@Param('id') id: number): Promise<GetUserDetailResponseDto> {
    return this.userService.getUserDetail(id);
  }

  @Put(':id')
  @SwaggerApiDocument({
    response: {
      type: UpdateUserResponseDto,
    },
    body: { type: UpdateUserBodyDto, required: true },
    operation: {
      operationId: `updateUser`,
      summary: `Api updateUser`,
    },
  })
  async updateUser(
    @Param('id') id: number,
    @Body() body: UpdateUserBodyDto,
  ): Promise<UpdateUserResponseDto> {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  @SwaggerApiDocument({
    response: {
      status: HttpStatus.NO_CONTENT,
    },
    operation: {
      operationId: `deleteUser`,
      summary: `Api deleteUser`,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: number): Promise<void> {
    await this.userService.deleteUser(id);
  }
}
