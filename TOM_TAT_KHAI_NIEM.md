# 📖 TÓM TẮT CÁC KHÁI NIỆM CƠ BẢN

## 🎯 NestJS là gì?

NestJS là một framework backend cho Node.js, giúp xây dựng API một cách có tổ chức và dễ bảo trì.

**So sánh với Frontend:**
- React có Component → NestJS có Module
- React có useState/useEffect → NestJS có Service
- React có Route → NestJS có Controller

---

## 🏗️ CẤU TRÚC DỰ ÁN

```
src/
├── main.ts                    # Điểm khởi đầu của ứng dụng
├── module/                    # Các module chức năng
│   ├── app.module.ts         # Module chính, import tất cả module khác
│   ├── user/                 # Module quản lý user
│   │   ├── user.controller.ts    # Nhận request từ client
│   │   ├── user.service.ts        # Xử lý logic nghiệp vụ
│   │   ├── user.module.ts         # Kết nối controller + service
│   │   └── dtos/                  # Định nghĩa cấu trúc dữ liệu
│   │       └── index.ts
│   ├── auth/                 # Module xác thực (đăng nhập)
│   └── product/              # Module quản lý sản phẩm (ví dụ)
├── decorator/                # Các decorator tùy chỉnh
├── guard/                    # Bảo vệ API (kiểm tra đăng nhập)
├── exception/                # Xử lý lỗi
└── common/                   # Các hàm/constant dùng chung
```

---

## 📦 MODULE - Đơn vị tổ chức code

**Module** giống như một "package" chứa các chức năng liên quan.

Ví dụ: `UserModule` chứa tất cả code liên quan đến user.

**Cấu trúc một Module:**
```
user/
├── user.controller.ts    # Định nghĩa các endpoint (route)
├── user.service.ts       # Logic nghiệp vụ
├── user.module.ts        # Đăng ký controller + service
└── dtos/                 # Định nghĩa dữ liệu
    └── index.ts
```

---

## 🎮 CONTROLLER - Nhận request từ client

**Controller** giống như router trong Express, định nghĩa các endpoint.

```typescript
@Controller('user')  // Route: /v1/user
export class UserController {
  
  @Get()              // GET /v1/user
  getUserList() { }
  
  @Get(':id')         // GET /v1/user/123
  getUserDetail(@Param('id') id: number) { }
  
  @Post()             // POST /v1/user
  createUser(@Body() body: CreateUserDto) { }
  
  @Put(':id')         // PUT /v1/user/123
  updateUser(@Param('id') id: number, @Body() body: UpdateUserDto) { }
  
  @Delete(':id')      // DELETE /v1/user/123
  deleteUser(@Param('id') id: number) { }
}
```

**Các decorator quan trọng:**
- `@Get()`, `@Post()`, `@Put()`, `@Delete()`: HTTP method
- `@Body()`: Lấy dữ liệu từ request body
- `@Query()`: Lấy dữ liệu từ query string (?page=1&size=10)
- `@Param()`: Lấy dữ liệu từ URL parameter (:id)

---

## ⚙️ SERVICE - Xử lý logic nghiệp vụ

**Service** chứa logic nghiệp vụ và tương tác với database.

```typescript
@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}
  
  async createUser(body: CreateUserDto) {
    // 1. Kiểm tra dữ liệu
    // 2. Xử lý logic
    // 3. Lưu vào database
    // 4. Trả về kết quả
  }
}
```

**Tại sao tách Controller và Service?**
- Controller: Chỉ nhận request và trả response (mỏng)
- Service: Chứa logic phức tạp, có thể tái sử dụng

---

## 📋 DTO - Định nghĩa cấu trúc dữ liệu

**DTO** (Data Transfer Object) định nghĩa cấu trúc dữ liệu cho request/response.

**3 loại DTO chính:**

### 1. BodyDto - Dữ liệu từ request body
```typescript
export class CreateUserBodyDto {
  @PropertyDto({ type: String, required: true, validated: true })
  email: string;
  
  @PropertyDto({ type: String, required: true, validated: true })
  firstName: string;
}
```

### 2. QueryDto - Dữ liệu từ query string
```typescript
export class GetUserListQueryDto extends PaginationQueryDto {
  @PropertyDto({ type: String, required: false, validated: true })
  name?: string;
}
```

### 3. ResponseDto - Dữ liệu trả về
```typescript
export class GetUserResponseDto {
  @PropertyDto()
  id: number;
  
  @PropertyDto()
  email: string;
  
  @PropertyDto()
  fullName: string;
}
```

---

## 🗄️ PRISMA - Tương tác với Database

**Prisma** là ORM (Object-Relational Mapping), giúp tương tác với database mà không cần viết SQL.

**Các thao tác cơ bản:**

```typescript
// Tìm tất cả
await this.databaseService.user.findMany({
  where: { status: 'Active' },
  take: 10,      // Lấy 10 bản ghi
  skip: 0,       // Bỏ qua 0 bản ghi đầu
})

// Tìm một
await this.databaseService.user.findFirst({
  where: { id: 1 }
})

// Tạo mới
await this.databaseService.user.create({
  data: {
    email: 'user@example.com',
    fullName: 'John Doe',
  }
})

// Cập nhật
await this.databaseService.user.update({
  where: { id: 1 },
  data: { fullName: 'Jane Doe' }
})

// Xóa
await this.databaseService.user.delete({
  where: { id: 1 }
})

// Đếm
await this.databaseService.user.count({
  where: { status: 'Active' }
})
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Authentication (Xác thực)
Kiểm tra user đã đăng nhập chưa.

```typescript
@UseGuards(AuthGuard)  // Yêu cầu đăng nhập
```

### Authorization (Phân quyền)
Kiểm tra user có quyền truy cập không.

```typescript
@RoleBaseAccessControl([AccessRole.Admin])  // Chỉ Admin
@RoleBaseAccessControl(true)                 // Bất kỳ user nào đã đăng nhập
@RoleBaseAccessControl(AccessRole.Public)    // Không cần đăng nhập
```

---

## 🎨 DECORATOR - Thêm metadata

**Decorator** là các hàm đặc biệt bắt đầu bằng `@`, dùng để thêm thông tin hoặc thay đổi hành vi.

```typescript
@Controller('user')        // Đánh dấu đây là controller
@Injectable()              // Đánh dấu đây là service
@Get()                     // Đánh dấu method xử lý GET request
@Body()                    // Lấy dữ liệu từ body
@PropertyDto()             // Định nghĩa property trong DTO
```

---

## 🔄 DEPENDENCY INJECTION (DI)

NestJS tự động tạo và inject các service vào nơi cần dùng.

```typescript
// Không cần tạo thủ công
constructor(private readonly userService: UserService) {}
// NestJS tự động tạo UserService và inject vào đây
```

**Lợi ích:**
- Dễ test (có thể mock service)
- Code sạch hơn
- Quản lý dependencies tốt hơn

---

## ⚠️ ERROR HANDLING

Sử dụng `ServerException` để throw lỗi:

```typescript
if (!user) {
  throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
}
```

Lỗi sẽ tự động được xử lý và trả về response chuẩn:
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

## 📊 PAGINATION - Phân trang

Dự án có sẵn helper để xử lý phân trang:

```typescript
// QueryDto
export class GetUserListQueryDto extends PaginationQueryDto {
  // Tự động có: page, pageSize
}

// Service
const { page, pageSize, take, skip } = validatePaginationQueryDto(query);

const [data, total] = await Promise.all([
  this.databaseService.user.findMany({ take, skip }),
  this.databaseService.user.count(),
]);

return {
  data,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  },
};
```

---

## 📝 QUY TẮC ĐẶT TÊN

### DTO
```
OperationId = createUser

- CreateUserResponseDto
- CreateUserBodyDto
- CreateUserQueryDto
```

### File
```
user.controller.ts
user.service.ts
user.module.ts
user.const.ts      # Constants
user.enum.ts       # Enums
user.type.ts       # Types
```

### OperationId
- PHẢI UNIQUE trong toàn bộ project
- Dùng camelCase: `createUser`, `getUserList`

---

## 🛠️ CÁC LỆNH THƯỜNG DÙNG

```bash
# Tạo module mới (khuyến nghị)
yarn nestjs

# Chạy server
yarn start:dev

# Xem Swagger
# http://localhost:3000/api-docs

# Database migration
yarn db

# Tạo admin
yarn genadmin -e admin@example.com -p password123
```

---

## 🎯 LUỒNG XỬ LÝ REQUEST

```
1. Client gửi request
   ↓
2. Middleware (xử lý CORS, logging, ...)
   ↓
3. Guard (kiểm tra đăng nhập, quyền)
   ↓
4. Controller (nhận request)
   ↓
5. Pipe (validate dữ liệu)
   ↓
6. Service (xử lý logic)
   ↓
7. Database (Prisma)
   ↓
8. Service (trả về dữ liệu)
   ↓
9. Controller (trả response)
   ↓
10. Client nhận response
```

---

## 💡 TIPS

1. **Luôn dùng `@PropertyDto()`** cho tất cả properties trong DTO
2. **Luôn dùng `@SwaggerApiDocument()`** cho tất cả endpoints
3. **OperationId phải unique** trong toàn bộ project
4. **Tách logic vào Service**, Controller chỉ nhận/trả dữ liệu
5. **Dùng `ServerException`** để throw lỗi
6. **Kiểm tra dữ liệu tồn tại** trước khi update/delete

---

## 📚 TÀI LIỆU THAM KHẢO

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- Xem code mẫu trong `src/module/user/` để học cách viết

---

Chúc bạn code vui vẻ! 🚀

