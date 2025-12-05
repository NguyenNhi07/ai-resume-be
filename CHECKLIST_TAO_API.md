# ✅ CHECKLIST TẠO API MỚI

Sử dụng checklist này mỗi khi tạo API mới để đảm bảo không bỏ sót bước nào.

---

## 📋 BƯỚC 1: Tạo Module (nếu chưa có)

- [ ] Chạy `yarn nestjs` để tạo module tự động HOẶC
- [ ] Tạo thư mục mới trong `src/module/`
- [ ] Tạo file `*.module.ts`

---

## 📋 BƯỚC 2: Tạo DTOs

Tạo file `dtos/index.ts` trong module:

- [ ] **ResponseDto** - Dữ liệu trả về
  - [ ] Dùng `@PropertyDto()` cho mỗi property
  - [ ] Không cần `required` và `validated` cho ResponseDto

- [ ] **BodyDto** - Dữ liệu từ request body (POST, PUT)
  - [ ] Dùng `@PropertyDto({ type, required, validated })`
  - [ ] Đánh dấu `required: true` cho field bắt buộc

- [ ] **QueryDto** - Dữ liệu từ query string (GET)
  - [ ] Extend `PaginationQueryDto` nếu cần phân trang
  - [ ] Dùng `@PropertyDto({ type, required: false, validated: true })`

- [ ] Đặt tên theo convention: `{OperationId}{Response/Body/Query}Dto`

---

## 📋 BƯỚC 3: Tạo Service

Tạo file `*.service.ts`:

- [ ] Thêm `@Injectable()` decorator
- [ ] Inject `DatabaseService` vào constructor
- [ ] Tạo method xử lý logic:
  - [ ] Validate dữ liệu đầu vào
  - [ ] Kiểm tra điều kiện (tồn tại, quyền, ...)
  - [ ] Tương tác với database qua Prisma
  - [ ] Throw `ServerException` nếu có lỗi
  - [ ] Trả về dữ liệu đúng kiểu ResponseDto

**Các method thường có:**
- [ ] `create*()` - Tạo mới
- [ ] `get*List()` - Lấy danh sách (có phân trang)
- [ ] `get*Detail()` - Lấy chi tiết
- [ ] `update*()` - Cập nhật
- [ ] `delete*()` - Xóa

---

## 📋 BƯỚC 4: Tạo Controller

Tạo file `*.controller.ts`:

- [ ] Thêm `@Controller('route-name')` với route prefix
- [ ] Thêm `@ApiTags('Tag Name')` cho Swagger
- [ ] Thêm `@UseGuards(AuthGuard)` nếu cần đăng nhập
- [ ] Thêm `@RoleBaseAccessControl()` để phân quyền
- [ ] Thêm `@ApiBearerAuth()` nếu cần token

**Cho mỗi endpoint:**
- [ ] Thêm HTTP method decorator: `@Get()`, `@Post()`, `@Put()`, `@Delete()`
- [ ] Thêm `@SwaggerApiDocument()` với:
  - [ ] `response.type` = ResponseDto
  - [ ] `response.isPagination = true` nếu là getList
  - [ ] `body.type` = BodyDto (nếu có body)
  - [ ] `operation.operationId` = **UNIQUE** trong toàn project
  - [ ] `operation.summary` = mô tả ngắn
- [ ] Inject Service vào constructor
- [ ] Tạo method gọi Service
- [ ] Dùng `@Body()`, `@Query()`, `@Param()` để lấy dữ liệu

---

## 📋 BƯỚC 5: Đăng ký Module

- [ ] Mở `src/module/app.module.ts`
- [ ] Import module mới vào `imports[]`

---

## 📋 BƯỚC 6: Kiểm tra

- [ ] Chạy `yarn start:dev`
- [ ] Mở Swagger: `http://localhost:3000/api-docs`
- [ ] Kiểm tra API xuất hiện trong Swagger
- [ ] Test API trong Swagger UI
- [ ] Kiểm tra validation hoạt động đúng
- [ ] Kiểm tra authentication/authorization hoạt động đúng
- [ ] Kiểm tra response đúng format

---

## 🎯 VÍ DỤ CHECKLIST HOÀN CHỈNH

### Tạo API: GET /v1/product?page=1&pageSize=10

**Bước 1: Module**
- [x] Module `product` đã tồn tại

**Bước 2: DTOs**
- [x] `GetProductListQueryDto extends PaginationQueryDto`
- [x] `GetProductListResponseDto` với các field cần thiết

**Bước 3: Service**
- [x] Method `getProductList(query: GetProductListQueryDto)`
- [x] Xử lý phân trang với `validatePaginationQueryDto()`
- [x] Tạo `where` clause cho filter
- [x] Dùng `Promise.all()` để lấy data và count
- [x] Trả về `PaginationResponseDto`

**Bước 4: Controller**
- [x] `@Get()` decorator
- [x] `@SwaggerApiDocument()` với `isPagination: true`
- [x] `operationId: 'getProductList'` (unique)
- [x] Method gọi `productService.getProductList(query)`

**Bước 5: Module**
- [x] Đã import vào `AppModule`

**Bước 6: Test**
- [x] API xuất hiện trong Swagger
- [x] Test thành công với query params
- [x] Phân trang hoạt động đúng

---

## ⚠️ CÁC LỖI THƯỜNG GẶP

### Lỗi: "OperationId must be unique"
- ✅ Kiểm tra `operationId` không trùng với API khác

### Lỗi: "Validation failed"
- ✅ Kiểm tra `@PropertyDto({ validated: true })` cho BodyDto/QueryDto
- ✅ Kiểm tra `required: true` cho field bắt buộc

### Lỗi: "Cannot find module"
- ✅ Kiểm tra đã import module vào `AppModule`
- ✅ Kiểm tra đường dẫn import đúng

### Lỗi: "Unauthorized"
- ✅ Kiểm tra đã thêm `@UseGuards(AuthGuard)`
- ✅ Kiểm tra token trong header
- ✅ Kiểm tra `@RoleBaseAccessControl()` đúng quyền

### Lỗi: "Not found"
- ✅ Kiểm tra route trong `@Controller()` đúng
- ✅ Kiểm tra HTTP method đúng
- ✅ Kiểm tra đã đăng ký module

---

## 📝 TEMPLATE NHANH

### Controller Template
```typescript
@Controller('resource')
@ApiTags('Resource')
@UseGuards(AuthGuard)
@RoleBaseAccessControl([AccessRole.Admin])
@ApiBearerAuth()
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  @SwaggerApiDocument({
    response: { type: GetResourceListResponseDto, isPagination: true },
    operation: { operationId: `getResourceList`, summary: `Api getResourceList` },
  })
  async getResourceList(@Query() query: GetResourceListQueryDto) {
    return this.resourceService.getResourceList(query);
  }
}
```

### Service Template
```typescript
@Injectable()
export class ResourceService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getResourceList(query: GetResourceListQueryDto) {
    const { page, pageSize, take, skip } = validatePaginationQueryDto(query);
    const where = { /* filter conditions */ };
    
    const [data, total] = await Promise.all([
      this.databaseService.resource.findMany({ where, take, skip }),
      this.databaseService.resource.count({ where }),
    ]);

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
```

---

## 🎉 HOÀN THÀNH!

Sau khi hoàn thành tất cả các bước, API của bạn đã sẵn sàng sử dụng!

