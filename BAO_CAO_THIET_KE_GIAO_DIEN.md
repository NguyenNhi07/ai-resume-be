# 2.6. Thiết kế Giao diện

## 2.6.1. Thiết kế tổng thể

Giao diện hệ thống được thiết kế đơn giản, dễ dùng, tập trung vào trải nghiệm người tìm việc. Hệ thống sử dụng **split-screen layout** với hai khu vực chính:

### Bố cục

- **Khu vực nhập dữ liệu (Form)**: Bên trái, chiếm 5/12 cột trên desktop
- **Khu vực xem trước CV (Preview)**: Bên phải, chiếm 7/12 cột trên desktop
- **Responsive**: Trên mobile, preview hiển thị bên dưới form

### Công nghệ

- React + TypeScript, Tailwind CSS, Ant Design
- Màu chủ đạo: Purple cho nút AI và accent, nền sáng, text tối
- Font: Inter mặc định, hỗ trợ 13 font families

## 2.6.2. Khu vực nhập dữ liệu

Form được chia thành **6 sections** với navigation Previous/Next:

1. **Personal Information**: Tên, ngày sinh, email, phone, địa chỉ, avatar
2. **Professional Summary**: Tóm tắt chuyên môn - có nút **"AI Enhance"**
3. **Experience**: Kinh nghiệm làm việc - có nút **"Enhance with AI"** cho mỗi mô tả
4. **Education**: Thông tin học vấn
5. **Projects**: Dự án - có nút **"Enhance with AI"** cho mỗi mô tả
6. **Skills**: Danh sách kỹ năng

### Đặc điểm

- Progress bar hiển thị tiến độ
- Real-time sync với preview
- Validation và helper text cho mỗi field
- Template selector, color picker, font selector
- Auto fill từ profile user

### Tích hợp AI

- Nút AI (màu purple, icon Sparkles) đặt bên cạnh label textarea
- UX: Click → Loading → Auto-apply kết quả → Toast notification
- Áp dụng cho: Summary, Experience descriptions, Project descriptions

## 2.6.3. Khu vực xem trước CV

- **Component**: `ResumePreview` với 5 templates (Classic, Modern, Minimal, Bold, Professional)
- **Real-time Update**: Tự động cập nhật khi form thay đổi
- **Styling**: Nền xám nhạt, border, shadow, apply font và accent color
- **Print Support**: CSS print styles cho Letter size (8.5in x 11in)

## 2.6.4. Khu vực hỗ trợ từ AI

### Tích hợp trong Form

- **Professional Summary**: Nút "AI Enhance" tối ưu toàn bộ summary
- **Experience**: Nút "Enhance with AI" cho từng job description
- **Projects**: Nút "Enhance with AI" cho từng project description

### Tính năng AI khác

- **Tailor by JD**: Tùy chỉnh CV theo Job Description với Accept/Reject từng section
- **Cover Letter**: Tạo thư xin việc từ CV và JD
- **Mock Interview**: Sinh câu hỏi phỏng vấn và chấm điểm

## 2.6.5. UX Enhancements

- **Feedback**: Toast notifications (Sonner), loading states, validation messages
- **Confirmation**: Modal xác nhận khi exit với unsaved changes
- **Accessibility**: Labels rõ ràng, required indicators, icons + text
- **Responsive**: Breakpoints cho desktop/tablet/mobile, touch-friendly buttons
