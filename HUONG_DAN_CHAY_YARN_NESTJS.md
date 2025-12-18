# 🚀 HƯỚNG DẪN CHẠY `yarn nestjs` ĐỂ TẠO MODULE RESUME

## 📋 Các bước thực hiện

### Bước 1: Chạy lệnh
```bash
yarn nestjs
```

### Bước 2: Trả lời các câu hỏi

#### Câu hỏi 1: "What do you want to generate?"
Chọn: **Complete module** (phím mũi tên để chọn, Enter để xác nhận)
- Đây sẽ tạo đầy đủ: module, service, controller với các CRUD operations

#### Câu hỏi 2: "Enter module name"
Nhập: **resume**
- Tool sẽ tự động chuyển thành: `Resume` (PascalCase) và `resume` (kebab-case)

#### Câu hỏi 3: "Do you want to use default module path src/module/resume"
Chọn: **Yes** (hoặc Enter vì mặc định là true)
- Đường dẫn mặc định: `src/module/resume`

#### Câu hỏi 4: "Enter Prisma model for this module (take from schema.prisma)"
Nhập: **Resume**
- ⚠️ **QUAN TRỌNG**: Phải viết hoa chữ cái đầu, đúng với tên model trong `schema.prisma`
- Tool sẽ kiểm tra xem model này có tồn tại trong schema không

### Bước 3: Chờ tool generate

Tool sẽ tự động tạo các file:
- ✅ `src/module/resume/resume.module.ts`
- ✅ `src/module/resume/resume.service.ts`
- ✅ `src/module/resume/resume.controller.ts`
- ✅ `src/module/resume/dtos/index.ts`
- ✅ `src/module/resume/index.ts`

---

## 🎯 Ví dụ đầy đủ

```
PS D:\ai-resume\nestjs-codebase> yarn nestjs

? What do you want to generate? Complete module
? Enter module name resume
? Do you want to use default module path src/module/resume (Y/n) Y
? Enter Prisma model for this module (take from schema.prisma) Resume

✅ Files generated successfully!
```

---

## ⚠️ Lưu ý quan trọng

1. **Tên Prisma model phải đúng**: Phải viết hoa chữ cái đầu và khớp với tên trong `schema.prisma`
   - ✅ Đúng: `Resume`, `User`, `Experience`
   - ❌ Sai: `resume`, `RESUME`, `resumes`

2. **File DTO phải tồn tại**: Tool cần file `prisma/dtos/resume.ts` để generate DTOs
   - File này được tạo tự động khi chạy `npx prisma generate`
   - Nếu chưa có, chạy: `npx prisma generate`

3. **Sau khi generate xong**: Cần import module vào `app.module.ts`

---

## 🔧 Nếu gặp lỗi

### Lỗi: "Model Resume not found in schema.prisma"
- ✅ Kiểm tra tên model trong `prisma/schema.prisma` phải là `model Resume {`
- ✅ Nhập đúng tên: `Resume` (viết hoa chữ cái đầu)

### Lỗi: "File prisma/dtos/resume.ts not found"
- ✅ Chạy: `npx prisma generate` để tạo lại các file DTO

### Module không được tạo
- ✅ Kiểm tra quyền ghi file trong thư mục `src/module/`
- ✅ Xem console có lỗi gì không

---

## 📝 Sau khi generate xong

1. **Kiểm tra các file đã được tạo**:
   ```bash
   ls src/module/resume
   ```

2. **Import module vào AppModule**:
   Mở `src/module/app.module.ts` và thêm:
   ```typescript
   import { ResumeModule } from 'src/module/resume';
   
   @Module({
     imports: [
       // ... các module khác
       ResumeModule,  // Thêm dòng này
     ],
   })
   ```

3. **Chạy lại server**:
   ```bash
   yarn start:dev
   ```

4. **Kiểm tra Swagger**:
   Mở: `http://localhost:3000/api-docs`
   - Sẽ thấy các API của Resume module

---

## 🎉 Hoàn thành!

Sau khi hoàn thành các bước trên, bạn sẽ có một module Resume hoàn chỉnh với:
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ DTOs đã được generate tự động
- ✅ Service với logic cơ bản
- ✅ Controller với các endpoints

Chúc bạn thành công! 🚀



cd nestjs-codebase
yarn prisma migrate dev --name add_resume_title --create-only
yarn prisma migrate deploy
yarn prisma generate
yarn start:dev

