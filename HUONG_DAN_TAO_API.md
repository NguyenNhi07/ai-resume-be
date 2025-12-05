# 📚 HƯỚNG DẪN TẠO API CHO NGƯỜI MỚI BẮT ĐẦU

## 🎯 Tổng quan dự án

Đây là một dự án **NestJS** (một framework backend cho Node.js, tương tự như Express nhưng có cấu trúc rõ ràng hơn). Dự án sử dụng:
- **NestJS**: Framework chính
- **Prisma**: ORM để làm việc với database (PostgreSQL)
- **TypeScript**: Ngôn ngữ lập trình
- **Swagger**: Tự động tạo tài liệu API

---

## 🏗️ Kiến trúc cơ bản của NestJS

Trong NestJS, mọi thứ được tổ chức thành **Modules**. Mỗi module thường có 3 thành phần chính:

1. **Controller** (`*.controller.ts`): Nhận request từ client, giống như router trong Express
2. **Service** (`*.service.ts`): Xử lý logic nghiệp vụ, tương tác với database
3. **DTO** (Data Transfer Object): Định nghĩa cấu trúc dữ liệu cho request/response

```
Request từ Frontend 
    ↓
Controller (nhận request)
    ↓
Service (xử lý logic)
    ↓
Database (Prisma)
    ↓
Service (trả về dữ liệu)
    ↓
Controller (trả response)
    ↓
Response về Frontend
```

---

## 📝 CÁC BƯỚC TẠO MỘT API MỚI

### Bước 1: Tạo Module mới (nếu chưa có)

Nếu bạn muốn tạo một chức năng mới (ví dụ: quản lý sản phẩm), bạn cần tạo một module mới.

**Cách 1: Sử dụng tool tự động (KHUYẾN NGHỊ)**
```bash
yarn nestjs
```
Tool này sẽ hỏi bạn các câu hỏi và tự động tạo các file cần thiết.

**Cách 2: Tạo thủ công**

Tạo thư mục mới trong `src/module/`, ví dụ: `src/module/product/`

---

### Bước 2: Tạo DTO (Data Transfer Object)

DTO là các class định nghĩa cấu trúc dữ liệu. Có 3 loại DTO chính:

1. **BodyDto**: Dữ liệu gửi trong body của request (POST, PUT)
2. **QueryDto**: Dữ liệu gửi trong query string (GET)
3. **ResponseDto**: Dữ liệu trả về cho client

**Ví dụ: Tạo API tạo sản phẩm mới**

Tạo file `src/module/product/dtos/index.ts`:

```typescript
import { PropertyDto } from 'src/decorator';

// 1. ResponseDto - Dữ liệu trả về
export class CreateProductResponseDto {
  @PropertyDto()
  id: number;

  @PropertyDto()
  name: string;

  @PropertyDto()
  price: number;

  @PropertyDto()
  createdAt: Date;
}

// 2. BodyDto - Dữ liệu nhận từ body
export class CreateProductBodyDto {
  @PropertyDto({
    type: String,
    required: true,      // Bắt buộc phải có
    validated: true,      // Có validate
  })
  name: string;

  @PropertyDto({
    type: Number,
    required: true,
    validated: true,
  })
  price: number;

  @PropertyDto({
    type: String,
    required: false,     // Không bắt buộc
    validated: true,
  })
  description?: string;
}

// 3. QueryDto - Dữ liệu từ query string (cho GET list)
import { PaginationQueryDto } from '@server/platform/dtos';

export class GetProductListQueryDto extends PaginationQueryDto {
  @PropertyDto({
    type: String,
    required: false,
    validated: true,
  })
  name?: string;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  minPrice?: number;

  @PropertyDto({
    type: Number,
    required: false,
    validated: true,
  })
  maxPrice?: number;
}

export class GetProductListResponseDto {
  @PropertyDto()
  id: number;

  @PropertyDto()
  name: string;

  @PropertyDto()
  price: number;
}
```

**Giải thích:**
- `@PropertyDto()`: Decorator đặc biệt của dự án này, tự động tạo validation và Swagger documentation
- `required: true`: Field bắt buộc phải có
- `validated: true`: Field sẽ được validate (kiểm tra kiểu dữ liệu)
- `PaginationQueryDto`: Class có sẵn để xử lý phân trang (page, pageSize)

---

### Bước 3: Tạo Service

Service chứa logic nghiệp vụ và tương tác với database.

Tạo file `src/module/product/product.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationResponseDto } from '@server/platform/dtos';
import { ERROR_RESPONSE } from 'src/common/const';
import { validatePaginationQueryDto } from 'src/common/helpers/request';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import {
  CreateProductBodyDto,
  CreateProductResponseDto,
  GetProductListQueryDto,
  GetProductListResponseDto,
  GetProductDetailResponseDto,
  UpdateProductBodyDto,
  UpdateProductResponseDto,
} from './dtos';

@Injectable()
export class ProductService {
  constructor(private readonly databaseService: DatabaseService) {}

  // Tạo sản phẩm mới
  async createProduct(body: CreateProductBodyDto): Promise<CreateProductResponseDto> {
    // Kiểm tra sản phẩm đã tồn tại chưa (nếu cần)
    const existingProduct = await this.databaseService.product.findFirst({
      where: { name: body.name },
    });
    
    if (existingProduct) {
      throw new ServerException(ERROR_RESPONSE.PRODUCT_ALREADY_EXISTS);
    }

    // Tạo sản phẩm mới
    return this.databaseService.product.create({
      data: {
        name: body.name,
        price: body.price,
        description: body.description,
      },
    });
  }

  // Lấy danh sách sản phẩm (có phân trang)
  async getProductList(
    query: GetProductListQueryDto,
  ): Promise<PaginationResponseDto<GetProductListResponseDto>> {
    // Xử lý phân trang
    const { page, pageSize, take, skip } = validatePaginationQueryDto(query);

    // Tạo điều kiện tìm kiếm (where clause)
    const where: Prisma.ProductWhereInput = {
      ...(query.name && { name: { contains: query.name } }), // Tìm theo tên
      ...(query.minPrice && { price: { gte: query.minPrice } }), // Giá >= minPrice
      ...(query.maxPrice && { price: { lte: query.maxPrice } }), // Giá <= maxPrice
    };

    // Lấy dữ liệu và đếm tổng số
    const [data, total] = await Promise.all([
      this.databaseService.product.findMany({
        where,
        take,      // Số lượng lấy
        skip,      // Bỏ qua bao nhiêu
        select: {
          id: true,
          name: true,
          price: true,
        },
      }),
      this.databaseService.product.count({ where }), // Đếm tổng số
    ]);

    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  // Lấy chi tiết một sản phẩm
  async getProductDetail(id: number): Promise<GetProductDetailResponseDto> {
    const product = await this.databaseService.product.findFirst({
      where: { id },
    });

    if (!product) {
      throw new ServerException(ERROR_RESPONSE.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  // Cập nhật sản phẩm
  async updateProduct(
    id: number,
    body: UpdateProductBodyDto,
  ): Promise<UpdateProductResponseDto> {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await this.databaseService.product.findFirst({
      where: { id },
    });

    if (!product) {
      throw new ServerException(ERROR_RESPONSE.PRODUCT_NOT_FOUND);
    }

    // Cập nhật
    return this.databaseService.product.update({
      where: { id },
      data: { ...body },
    });
  }

  // Xóa sản phẩm
  async deleteProduct(id: number): Promise<void> {
    const product = await this.databaseService.product.findFirst({
      where: { id },
    });

    if (!product) {
      throw new ServerException(ERROR_RESPONSE.PRODUCT_NOT_FOUND);
    }

    await this.databaseService.product.delete({
      where: { id },
    });
  }
}
```

**Giải thích:**
- `@Injectable()`: Decorator để NestJS biết đây là một service có thể inject vào nơi khác
- `DatabaseService`: Service có sẵn để tương tác với database qua Prisma
- `findFirst()`, `findMany()`, `create()`, `update()`, `delete()`: Các method của Prisma để thao tác database
- `ServerException`: Class để throw lỗi (sẽ tự động trả về response lỗi cho client)
- `validatePaginationQueryDto()`: Helper function để xử lý phân trang

---

### Bước 4: Tạo Controller

Controller nhận request từ client và gọi service.

Tạo file `src/module/product/product.controller.ts`:

```typescript
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
  CreateProductBodyDto,
  CreateProductResponseDto,
  GetProductListQueryDto,
  GetProductListResponseDto,
  GetProductDetailResponseDto,
  UpdateProductBodyDto,
  UpdateProductResponseDto,
} from './dtos';
import { ProductService } from './product.service';

@Controller('product')  // Route prefix: /v1/product
@ApiTags('Product')     // Nhóm API trong Swagger
@UseGuards(AuthGuard)   // Yêu cầu đăng nhập
@RoleBaseAccessControl([AccessRole.Admin])  // Chỉ Admin mới được dùng
@ApiBearerAuth()        // Cần token để gọi API
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // POST /v1/product
  @Post()
  @SwaggerApiDocument({
    response: {
      type: CreateProductResponseDto,
    },
    body: { type: CreateProductBodyDto, required: true },
    operation: {
      operationId: `createProduct`,  // PHẢI UNIQUE trong toàn bộ project
      summary: `Api createProduct`,
    },
  })
  async createProduct(
    @Body() body: CreateProductBodyDto,
  ): Promise<CreateProductResponseDto> {
    return this.productService.createProduct(body);
  }

  // GET /v1/product?page=1&pageSize=10&name=abc
  @Get()
  @SwaggerApiDocument({
    response: {
      type: GetProductListResponseDto,
      isPagination: true,  // Đánh dấu API có phân trang
    },
    operation: {
      operationId: `getProductList`,
      summary: `Api getProductList`,
    },
  })
  async getProductList(
    @Query() query: GetProductListQueryDto,
  ): Promise<PaginationResponseDto<GetProductListResponseDto>> {
    return this.productService.getProductList(query);
  }

  // GET /v1/product/:id
  @Get(':id')
  @SwaggerApiDocument({
    response: {
      type: GetProductDetailResponseDto,
    },
    operation: {
      operationId: `getProductDetail`,
      summary: `Api getProductDetail`,
    },
  })
  async getProductDetail(
    @Param('id') id: number,
  ): Promise<GetProductDetailResponseDto> {
    return this.productService.getProductDetail(id);
  }

  // PUT /v1/product/:id
  @Put(':id')
  @SwaggerApiDocument({
    response: {
      type: UpdateProductResponseDto,
    },
    body: { type: UpdateProductBodyDto, required: true },
    operation: {
      operationId: `updateProduct`,
      summary: `Api updateProduct`,
    },
  })
  async updateProduct(
    @Param('id') id: number,
    @Body() body: UpdateProductBodyDto,
  ): Promise<UpdateProductResponseDto> {
    return this.productService.updateProduct(id, body);
  }

  // DELETE /v1/product/:id
  @Delete(':id')
  @SwaggerApiDocument({
    response: {
      status: HttpStatus.NO_CONTENT,  // 204 No Content
    },
    operation: {
      operationId: `deleteProduct`,
      summary: `Api deleteProduct`,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param('id') id: number): Promise<void> {
    await this.productService.deleteProduct(id);
  }
}
```

**Giải thích:**
- `@Controller('product')`: Định nghĩa route prefix là `/v1/product` (v1 là version mặc định)
- `@Post()`, `@Get()`, `@Put()`, `@Delete()`: HTTP methods
- `@Body()`, `@Query()`, `@Param()`: Lấy dữ liệu từ request
- `@UseGuards(AuthGuard)`: Yêu cầu đăng nhập
- `@RoleBaseAccessControl()`: Kiểm tra quyền truy cập
- `@SwaggerApiDocument()`: Tự động tạo documentation cho Swagger
- `operationId`: PHẢI UNIQUE trong toàn bộ project

---

### Bước 5: Tạo Module

Module kết nối Controller và Service lại với nhau.

Tạo file `src/module/product/product.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],  // Export nếu module khác cần dùng
})
export class ProductModule {}
```

**Giải thích:**
- `controllers`: Danh sách controllers trong module
- `providers`: Danh sách services trong module
- `exports`: Export service nếu module khác cần dùng

---

### Bước 6: Đăng ký Module vào AppModule

Mở file `src/module/app.module.ts` và thêm module mới:

```typescript
import { ProductModule } from 'src/module/product/product.module';

@Module({
  imports: [
    // ... các module khác
    ProductModule,  // Thêm dòng này
  ],
})
export class AppModule {}
```

---

## 🔍 CÁC KHÁI NIỆM QUAN TRỌNG

### 1. Decorator là gì?

Decorator là các hàm đặc biệt bắt đầu bằng `@`, dùng để thêm metadata hoặc thay đổi hành vi của class/method.

Ví dụ:
- `@Controller('product')`: Đánh dấu class này là controller với route `/product`
- `@Get()`: Đánh dấu method này xử lý GET request
- `@Body()`: Lấy dữ liệu từ request body

### 2. Dependency Injection (DI)

NestJS tự động inject các service vào constructor. Bạn không cần tạo instance thủ công.

```typescript
constructor(private readonly productService: ProductService) {}
// NestJS tự động tạo ProductService và inject vào đây
```

### 3. Prisma - ORM

Prisma là công cụ để tương tác với database. Thay vì viết SQL, bạn dùng các method:

```typescript
// Tìm tất cả
await this.databaseService.product.findMany()

// Tìm một
await this.databaseService.product.findFirst({ where: { id: 1 } })

// Tạo mới
await this.databaseService.product.create({ data: { name: 'ABC' } })

// Cập nhật
await this.databaseService.product.update({ 
  where: { id: 1 }, 
  data: { name: 'XYZ' } 
})

// Xóa
await this.databaseService.product.delete({ where: { id: 1 } })
```

### 4. Validation

DTO tự động validate dữ liệu nhờ `@PropertyDto()` và `PayloadValidationPipe`. Nếu dữ liệu không hợp lệ, API sẽ trả về lỗi 400.

### 5. Error Handling

Sử dụng `ServerException` để throw lỗi:

```typescript
if (!product) {
  throw new ServerException(ERROR_RESPONSE.PRODUCT_NOT_FOUND);
}
```

Lỗi sẽ tự động được xử lý và trả về response chuẩn cho client.

---

## 📋 QUY TẮC ĐẶT TÊN

### DTO Naming Convention

```
OperationId = createProduct

- ResponseDto: CreateProductResponseDto
- BodyDto: CreateProductBodyDto  
- QueryDto: GetProductListQueryDto
```

### File Structure

```
src/module/product/
  ├── product.controller.ts    # Controller
  ├── product.service.ts        # Service
  ├── product.module.ts         # Module
  ├── dtos/
  │   └── index.ts             # Tất cả DTOs
  ├── product.const.ts          # Constants (nếu cần)
  ├── product.enum.ts           # Enums (nếu cần)
  └── product.type.ts           # Types (nếu cần)
```

---

## 🎯 VÍ DỤ HOÀN CHỈNH: API Lấy danh sách sản phẩm

### 1. DTO

```typescript
// dtos/index.ts
export class GetProductListQueryDto extends PaginationQueryDto {
  @PropertyDto({ type: String, required: false, validated: true })
  name?: string;
}

export class GetProductListResponseDto {
  @PropertyDto()
  id: number;

  @PropertyDto()
  name: string;

  @PropertyDto()
  price: number;
}
```

### 2. Service

```typescript
// product.service.ts
async getProductList(query: GetProductListQueryDto) {
  const { page, pageSize, take, skip } = validatePaginationQueryDto(query);
  
  const where = {
    ...(query.name && { name: { contains: query.name } }),
  };

  const [data, total] = await Promise.all([
    this.databaseService.product.findMany({ where, take, skip }),
    this.databaseService.product.count({ where }),
  ]);

  return {
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
```

### 3. Controller

```typescript
// product.controller.ts
@Get()
@SwaggerApiDocument({
  response: { type: GetProductListResponseDto, isPagination: true },
  operation: { operationId: `getProductList`, summary: `Api getProductList` },
})
async getProductList(@Query() query: GetProductListQueryDto) {
  return this.productService.getProductList(query);
}
```

### 4. Kết quả

Frontend gọi: `GET /v1/product?page=1&pageSize=10&name=abc`

Response:
```json
{
  "data": [
    { "id": 1, "name": "abc", "price": 100 },
    { "id": 2, "name": "abc123", "price": 200 }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Public API (không cần đăng nhập)

```typescript
@RoleBaseAccessControl(AccessRole.Public)
```

### API cần đăng nhập

```typescript
@UseGuards(AuthGuard)
@RoleBaseAccessControl(true)  // Bất kỳ user nào đã đăng nhập
```

### API chỉ Admin

```typescript
@UseGuards(AuthGuard)
@RoleBaseAccessControl([AccessRole.Admin])
```

### Lấy thông tin user hiện tại

```typescript
async getMyInfo(@User('id') userId: number) {
  // userId là ID của user đang đăng nhập
}
```

---

## 🛠️ CÁC LỆNH HỮU ÍCH

```bash
# Tạo module mới (khuyến nghị)
yarn nestjs

# Chạy server development
yarn start:dev

# Xem Swagger documentation
# Mở browser: http://localhost:3000/api-docs

# Tạo migration database
yarn db

# Tạo admin user
yarn genadmin -e admin@example.com -p password123
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ❓ CÂU HỎI THƯỜNG GẶP

**Q: Làm sao để tạo API không cần đăng nhập?**
A: Thêm `@RoleBaseAccessControl(AccessRole.Public)` vào controller method.

**Q: Làm sao để lấy thông tin user đang đăng nhập?**
A: Dùng `@User('id')` hoặc `@User()` trong controller method.

**Q: Làm sao để validate dữ liệu?**
A: Dùng `@PropertyDto({ validated: true })` trong DTO, hệ thống sẽ tự động validate.

**Q: Làm sao để xử lý lỗi?**
A: Dùng `throw new ServerException(ERROR_RESPONSE.XXX)` trong service.

**Q: Làm sao để test API?**
A: Mở Swagger UI tại `http://localhost:3000/api-docs` và test trực tiếp.

---

## 🎉 CHÚC MỪNG!

Bạn đã hiểu cách tạo API trong dự án NestJS này. Hãy bắt đầu với một API đơn giản và dần dần làm quen với các khái niệm phức tạp hơn!

