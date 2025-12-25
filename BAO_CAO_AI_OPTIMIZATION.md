# 2.5. Hệ thống Tối ưu CV bằng AI

## 2.5.1. Phân tích yêu cầu AI

### Mục tiêu
Hệ thống cải thiện diễn đạt, ngôn từ, cấu trúc và từ khóa trong từng phần CV, giữ nguyên ý nghĩa người dùng cung cấp; đầu ra phù hợp tiêu chuẩn tuyển dụng và ATS (Applicant Tracking System).

### Phạm vi áp dụng
Hệ thống hiện tại hỗ trợ tối ưu hóa nội dung CV thông qua API `/ai/optimize-text` với khả năng xử lý các phần:
- **Summary / Objective**: Tóm tắt chuyên môn
- **Mô tả kinh nghiệm (Experience)**: Kinh nghiệm làm việc
- **Kỹ năng (Skills)**: Chuẩn hoá từ khóa kỹ năng
- **Học vấn (Education)**: Thông tin học vấn
- **Dự án (Projects)**: Mô tả dự án

### Yêu cầu chất lượng
Hệ thống đảm bảo:
- **Không invent**: Không thêm thông tin không có trong input (được enforce trong prompt)
- **Ngắn gọn**: Sử dụng động từ hành động, số liệu/kết quả (nếu user có)
- **Format dễ đọc**: Giữ nguyên format bullet hoặc đoạn văn ngắn

### Yêu cầu phi chức năng
- **Phản hồi nhanh**: Xử lý đồng bộ, thời gian phản hồi phụ thuộc vào Google Gemini API
- **Error handling**: Xử lý lỗi 503 (service unavailable) và 429 (quota exceeded) với thông báo rõ ràng
- **Bảo mật**: API key được lưu trên server qua biến môi trường `GEMINI_API_KEY`, không expose ra client

## 2.5.2. Thiết kế prompt tối ưu CV

### Nguyên tắc thiết kế
Prompt được thiết kế với cấu trúc rõ ràng, bao gồm:
- **System role**: Định nghĩa AI là "professional resume writing assistant"
- **Task description**: Mô tả nhiệm vụ cải thiện và tối ưu text
- **Constraints**: Yêu cầu explicit không tạo thêm thông tin

### Mẫu prompt hiện tại
```
You are a professional resume writing assistant.

Task:
Improve and optimize the following text to make it more professional, concise, and impactful.

IMPORTANT:
- The output MUST be in the SAME LANGUAGE as the input text
- Do NOT translate unless the input itself is translated
- Do NOT add new information

Guidelines:
- Use professional and formal language
- Be concise and clear
- Highlight achievements and skills
- Use strong action verbs
- Keep original meaning and key details
- Ensure correct grammar and structure

Original text:
"""
{text}
"""

Return ONLY the optimized text.
```

### Đặc điểm prompt
- **Giữ nguyên ngôn ngữ**: Tự động detect và giữ nguyên ngôn ngữ input (tiếng Việt/Anh)
- **Không invent**: Rule rõ ràng "Do NOT add new information"
- **Format linh hoạt**: Không ép buộc format cụ thể, AI tự quyết định dựa trên input

### Post-processing hiện tại
- **Trim whitespace**: Loại bỏ khoảng trắng thừa ở đầu/cuối bằng `.trim()`
- **Fallback**: Nếu AI trả về lỗi, hệ thống throw error với message phù hợp

## 2.5.3. Cơ chế gọi Google Gemini API trong backend Node.js

### Luồng gọi cơ bản
1. **Frontend gửi request**: `POST /api/ai/optimize-text` với payload `{ text: string }` kèm JWT token
2. **Backend xử lý**:
   - `AiController.optimizeText()` nhận request
   - `AuthGuard` kiểm tra authentication và authorization
   - `AiService.optimizeText()` xử lý logic
3. **Build prompt**: Prompt được build từ template với nội dung text từ user
4. **Gọi Gemini API**: Sử dụng `@google/genai` SDK với model `gemini-2.5-flash`
5. **Xử lý response**: Parse response, trim text, trả về cho frontend

### Kỹ thuật triển khai

#### API Integration
- **SDK**: Sử dụng `@google/genai` (Google Generative AI SDK)
- **Model**: `gemini-2.5-flash` - model nhanh, phù hợp cho tối ưu text
- **Initialization**: 
  ```typescript
  this.ai = new GoogleGenAI({ apiKey: ServerConfig.get().GEMINI_API_KEY });
  ```

#### Error Handling
Hệ thống xử lý các lỗi phổ biến:
- **503 (Service Unavailable)**: "AI đang quá tải, vui lòng thử lại sau vài giây."
- **429 (Quota Exceeded)**: 
  - Nếu message chứa "quota" hoặc "Quota exceeded": "Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ."
  - Ngược lại: "Quá nhiều yêu cầu, vui lòng thử lại sau vài phút."

#### Rate Limiting
- **Middleware**: `RateLimitMiddleware` đã được implement nhưng đang bị comment trong `AppModule`
- **Config**: Sử dụng `THROTTLER_LIMIT` và `THROTTLER_TTL` từ `ServerConfig`
- **Status**: Hiện tại chưa được kích hoạt, cần enable để tránh vượt quota

#### Retry Logic
- **Hiện trạng**: Chưa có retry logic tự động
- **Khuyến nghị**: Cần implement retry với exponential backoff cho lỗi 503/5xx

#### Timeout
- **Hiện trạng**: Không có timeout explicit cho Gemini API call
- **Khuyến nghị**: Thêm timeout ~10s để tránh request treo lâu

#### Security
- **API Key**: Lưu trong biến môi trường `GEMINI_API_KEY`, không expose ra client
- **Authentication**: Tất cả API đều yêu cầu JWT token qua `AuthGuard`
- **Authorization**: Sử dụng `RoleBaseAccessControl` để kiểm soát quyền truy cập

## 2.5.4. Chuẩn hóa dữ liệu trả về

### Các bước chuẩn hóa hiện tại

#### 1. Trim & Normalize
- **Trim whitespace**: Sử dụng `.trim()` để loại bỏ khoảng trắng đầu/cuối
- **Chuẩn hóa bullet**: Chưa có logic chuẩn hóa ký tự bullet (hiện tại giữ nguyên format từ AI)

#### 2. Validate không invent
- **Hiện trạng**: Validation được thực hiện ở tầng prompt (AI được yêu cầu không invent)
- **Khuyến nghị**: Cần thêm validation phía backend để so sánh entities/dates/numbers giữa input và output

#### 3. Escape & Sanitize
- **Hiện trạng**: Chưa có sanitization cho HTML/Markdown
- **Khuyến nghị**: Thêm sanitization để prevent XSS nếu render trực tiếp

#### 4. Chuẩn hoá format
- **Input detection**: Chưa có logic detect format (bullet vs paragraph)
- **Format preservation**: AI tự quyết định format dựa trên input
- **Length constraints**: Chưa có giới hạn độ dài cụ thể

#### 5. Lưu log
- **Hiện trạng**: Chưa có bảng `ai_optimization_logs` để lưu lịch sử
- **Khuyến nghị**: 
  - Tạo model `AiOptimizationLog` trong Prisma schema
  - Lưu `beforeContent`, `afterContent`, `userId`, `timestamp`, `modelUsed`
  - Hỗ trợ tính năng undo từ log

#### 6. Response format
- **Hiện tại**: Trả về `{ optimizedText: string }`
- **Khuyến nghị**: Mở rộng thành `{ optimizedContent, suggestions, applied: false }` để:
  - Frontend hiển thị diff/highlight
  - User quyết định Apply trước khi overwrite
  - Cung cấp suggestions nếu AI muốn thêm thông tin

### UX Flow
- **Hiện tại**: Frontend gọi API → nhận optimized text → tự động apply
- **Khuyến nghị**: Frontend gọi API → hiển thị diff/highlight → user review → user quyết định Apply/Reject → nếu Apply thì update CV

## 2.5.5. Các API liên quan

Ngoài API tối ưu text, hệ thống còn cung cấp các API AI khác:

1. **`POST /ai/optimize-text`**: Tối ưu text chung chung
2. **`POST /ai/score-resume-jd`**: Chấm điểm CV so với Job Description
3. **`POST /ai/cover-letter`**: Tạo thư xin việc từ CV và JD
4. **`POST /ai/interview-questions`**: Sinh câu hỏi phỏng vấn
5. **`POST /ai/interview-score`**: Chấm điểm câu trả lời phỏng vấn
6. **`POST /ai/tailor-resume-jd`**: Tùy chỉnh CV theo JD

## 2.5.6. Cải thiện đề xuất

### Ngắn hạn
1. **Enable rate limiting**: Kích hoạt `RateLimitMiddleware` cho các API AI
2. **Thêm timeout**: Implement timeout ~10s cho Gemini API calls
3. **Chuẩn hóa bullet**: Normalize bullet characters về format thống nhất

### Trung hạn
1. **Retry logic**: Implement retry với exponential backoff cho lỗi tạm thời
2. **Audit logging**: Tạo bảng `AiOptimizationLog` và lưu lịch sử optimization
3. **Validation**: Thêm validation để detect AI invent thông tin

### Dài hạn
1. **Format detection**: Tự động detect format input (bullet vs paragraph)
2. **Length constraints**: Thêm constraints về độ dài output
3. **Suggestions system**: Tách suggestions ra khỏi optimized content
4. **Undo feature**: Implement tính năng undo từ audit log

