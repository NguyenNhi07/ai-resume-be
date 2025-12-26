## 3.3 Cài đặt Frontend (React và TailwindCSS)

Frontend của ứng dụng được xây dựng bằng **React 19** kết hợp với **TypeScript**, sử dụng **Vite** làm build tool và **TailwindCSS 4** cho styling. Ứng dụng được tổ chức theo kiến trúc component-based, sử dụng **React Router** để quản lý routing và **React i18next** để hỗ trợ đa ngôn ngữ. UI được xây dựng với **Ant Design (antd)** làm component library chính, kết hợp với các icon từ **Lucide React**.

---

### 3.3.1 Cấu trúc thư mục frontend

Frontend được tổ chức theo cấu trúc modular, mỗi thư mục có vai trò cụ thể:

- **Thư mục gốc frontend (`ai-resume-fe/`)**:
  - `src/`: chứa toàn bộ source code
    - `pages/`: các trang chính của ứng dụng
      - `Home.tsx`: Landing page
      - `Login.tsx`, `ForgotPassword.tsx`, `VerifyEmail.tsx`: các trang authentication
      - `Dashboard.tsx`: trang quản lý danh sách CV
      - `ResumeBuilder.tsx`: trang tạo/chỉnh sửa CV theo step
      - `ResumeDetail.tsx`: trang xem chi tiết CV và các tính năng AI
      - `CoverLetter.tsx`: trang tạo thư xin việc bằng AI
      - `MockInterview.tsx`: trang tạo và chấm điểm câu hỏi phỏng vấn
      - `TailorByJD.tsx`: trang tối ưu CV theo JD
      - `Preview.tsx`: trang preview CV công khai (cho guest)
      - `ProfileManagement.tsx`, `ChangePassword.tsx`, `Language.tsx`: các trang trong phần Settings
      - `Layout.tsx`, `AuthLayout.tsx`, `SettingLayout.tsx`: các layout wrapper
    - `components/`: các component tái sử dụng
      - `ResumePreview.tsx`: component preview CV chính
      - `TailoredResumePreview.tsx`: component preview CV với tính năng Accept/Reject thay đổi AI
      - `PersonalInfoForm.tsx`, `ExperienceForm.tsx`, `EducationForm.tsx`, `ProjectForm.tsx`, `SkillsForm.tsx`, `ProfessionalSummaryForm.tsx`: các form component cho từng section của CV
      - `TemplateSelector.tsx`: component chọn template CV
      - `ColorPicker.tsx`: component chọn màu accent
      - `UploadImage.tsx`: component upload ảnh đại diện
      - `ShareDialog.tsx`: dialog chia sẻ CV
      - `ScoreHistoryModal.tsx`: modal hiển thị lịch sử điểm số CV
      - `template/`: các component template CV (ClassicTemplate, ModernTemplate, BoldTemplate, ProfessionalTemplate, MinimalTemplate, MinimalImageTemplate)
      - `home/`: các component cho landing page (Hero, Feature, Testimonials, Footer, Banner, CallToAction)
      - `icons/`: các icon component tùy chỉnh
      - `setting/`: các component cho phần Settings
    - `lib/`:
      - `api.ts`: client API để gọi các endpoint backend, bao gồm các hàm mapping dữ liệu giữa frontend và backend format (`toBackendResume`, `toFrontendResume`)
      - `type.ts`: định nghĩa các TypeScript types/interfaces cho Resume, User, Experience, Education, Project...
      - `utils.ts`: các utility functions (format date, extract skills từ JD, validate...)
      - `constant.ts`: các hằng số dùng chung
      - `phone-utils.ts`: utilities cho xử lý số điện thoại
      - `toast.tsx`: component toast notification
    - `hooks/`:
      - `useToast.ts`: custom hook để hiển thị toast messages
    - `i18n/`:
      - `i18n.ts`: cấu hình i18next, load các file ngôn ngữ từ `messages/`
    - `messages/`: các file JSON chứa translations (vi.json, en.json, ko.json, fr.json, jp.json, cn.json)
    - `constants/`:
      - `languageOptions.tsx`: danh sách các ngôn ngữ được hỗ trợ
    - `App.tsx`: component gốc, định nghĩa routing với React Router
    - `main.tsx`: entry point, khởi tạo React app và BrowserRouter
    - `index.css`: global styles, TailwindCSS directives
  - `public/`: các file static (logo, images)
  - `package.json`: dependencies và scripts
  - `vite.config.ts`: cấu hình Vite
  - `tsconfig.json`: cấu hình TypeScript

Cấu trúc này giúp mã nguồn dễ bảo trì, tái sử dụng component, và mở rộng tính năng mới.

---

### 3.3.2 Triển khai giao diện chính

#### Đăng ký, đăng nhập

- **Trang đăng nhập (`Login.tsx`)**:
  - Form đăng nhập với 2 trường: email và password
  - Validation: kiểm tra email hợp lệ và password không rỗng
  - Khi submit, gọi `authApi.login(email, password)` từ `lib/api.ts`
  - Nếu thành công, lưu `accessToken` và `refreshToken` vào `localStorage`, sau đó redirect về `/app` (Dashboard)
  - Nếu thất bại, hiển thị toast error với thông báo từ backend
  - Có link "Forgot password?" để điều hướng đến trang quên mật khẩu

- **Trang đăng ký** (nếu có):
  - Form đăng ký với các trường: fullName, email, password, confirmPassword
  - Validation: email hợp lệ, password tối thiểu 6 ký tự, confirmPassword khớp với password
  - Gọi `authApi.register(...)` để tạo tài khoản mới
  - Sau khi đăng ký thành công, tự động đăng nhập hoặc redirect về trang login

#### Quên mật khẩu

- **Trang quên mật khẩu (`ForgotPassword.tsx`)**:
  - Form với 2 trường: email và newPassword (mật khẩu mới muốn đặt)
  - Khi submit, gọi `authApi.forgotPassword(email, newPassword)`
  - Backend sẽ:
    - Tạo OTP 6 chữ số
    - Hash OTP và lưu vào database cùng với thời gian hết hạn
    - Gửi email chứa OTP đến người dùng (hoặc log ra console nếu chưa cấu hình SMTP)
  - Sau khi gửi thành công, lưu `newPassword` vào `sessionStorage` với key `reset_password` để dùng khi resend OTP
  - Redirect đến trang verify email với query param `email`

#### Xác thực OTP

- **Trang xác thực OTP (`VerifyEmail.tsx`)**:
  - Nhận `email` từ query params (`useSearchParams`)
  - Hiển thị 6 ô input để nhập OTP (mỗi ô 1 chữ số)
  - Tự động focus sang ô tiếp theo khi nhập, hỗ trợ Backspace để quay lại ô trước
  - Có countdown timer (120 giây) để hiển thị nút "Resend"
  - Khi nhập đủ 6 chữ số và submit:
    - Gọi `authApi.verifyOtp(email, otpCode)`
    - Backend kiểm tra OTP có đúng và chưa hết hạn không
    - Nếu đúng, backend cập nhật password mới và xóa OTP khỏi database
    - Frontend xóa `reset_password` khỏi `sessionStorage` và redirect về trang login
  - Nút "Resend": khi hết countdown, người dùng có thể bấm để gửi lại OTP:
    - Lấy `password` từ `sessionStorage`
    - Gọi lại `authApi.forgotPassword(email, password)` để gửi OTP mới
    - Reset countdown về 120 giây

#### Landing page

- **Trang chủ (`Home.tsx`)**:
  - Landing page giới thiệu về ứng dụng
  - Bao gồm các component:
    - `Banner`: banner trên cùng (có thể là thông báo khuyến mãi, tính năng mới...)
    - `Hero`: phần hero section với tiêu đề, mô tả ngắn, và CTA button "Get Started"
    - `Feature`: giới thiệu các tính năng chính (tạo CV, tối ưu bằng AI, đánh giá CV...)
    - `Testimonials`: phần testimonials từ người dùng
    - `CallToAction`: phần kêu gọi hành động cuối trang
    - `Footer`: footer với links, thông tin liên hệ, social media
  - Responsive design, hỗ trợ mobile và desktop
  - CTA button điều hướng đến trang đăng ký hoặc đăng nhập

---

### 3.3.3 Giao diện quản lý hồ sơ cá nhân

#### Nhập và cập nhật thông tin người dùng

- **Trang quản lý profile (`ProfileManagement.tsx`)**:
  - Hiển thị thông tin user hiện tại: fullName, email, dateOfBirth, phoneNumber, gender, profession
  - Có 2 chế độ: **View mode** và **Edit mode**
  - Khi ở chế độ View:
    - Hiển thị thông tin dạng read-only
    - Có nút "Edit" để chuyển sang Edit mode
  - Khi ở chế độ Edit:
    - Form với các trường có thể chỉnh sửa:
      - `fullName`: input text, hỗ trợ Unicode (tiếng Việt có dấu) thông qua component `AllowedCharsInput`
      - `email`: input email (read-only, không thể đổi)
      - `dateOfBirth`: DatePicker từ Ant Design, validate tuổi >= 18
      - `phoneNumber`: component `PhoneInput` với validation số điện thoại quốc tế
      - `gender`: Radio group (Male/Female/Other)
      - `profession`: input text, hỗ trợ Unicode
    - Có nút "Save" và "Cancel"
    - Khi Save: gọi `userApi.updateProfile(...)` để cập nhật thông tin lên backend
    - Sử dụng `UnsavedChangesContext` để cảnh báo nếu có thay đổi chưa lưu khi navigate đi

#### Đồng bộ thông tin người dùng vào sơ yếu lý lịch

- Trong `ResumeBuilder.tsx` và `PersonalInfoForm.tsx`:
  - Có nút "Auto-fill from profile" hoặc tương tự
  - Khi bấm, gọi `userApi.me()` để lấy thông tin profile hiện tại
  - Tự động điền các trường trong form CV:
    - `full_name` ← `user.fullName`
    - `email` ← `user.email`
    - `phone` ← `user.phoneNumber`
    - `location` ← có thể từ profile nếu có
    - `profession` ← `user.profession`
  - Người dùng có thể chỉnh sửa lại sau khi auto-fill

#### Đa ngôn ngữ

- **Cấu hình i18n (`i18n/i18n.ts`)**:
  - Sử dụng `react-i18next` và `i18next`
  - Hỗ trợ 6 ngôn ngữ: English (en), Tiếng Việt (vi), 한국어 (ko), Français (fr), 日本語 (jp), 中文 (cn)
  - Load translations từ các file JSON trong `messages/`
  - Lưu ngôn ngữ đã chọn vào `localStorage` với key `i18nextLng`
  - Khi khởi động app, tự động load ngôn ngữ đã lưu, mặc định là "en"

- **Trang chọn ngôn ngữ (`Language.tsx`)**:
  - Hiển thị danh sách các ngôn ngữ với flag icon và tên ngôn ngữ
  - Khi chọn một ngôn ngữ:
    - Gọi `i18n.changeLanguage(lng)`
    - Lưu vào `localStorage`
    - Toàn bộ UI tự động cập nhật sang ngôn ngữ mới

- **Sử dụng trong components**:
  - Import `useTranslation` hook: `const { t } = useTranslation()`
  - Dùng `t("key")` để lấy translation, ví dụ: `t("Login")`, `t("Save")`
  - Tất cả text trong UI đều được dịch, bao gồm: labels, buttons, messages, placeholders, tooltips...

#### Đổi mật khẩu

- **Trang đổi mật khẩu (`ChangePassword.tsx`)**:
  - Form với 3 trường:
    - `oldPassword`: mật khẩu cũ (required)
    - `newPassword`: mật khẩu mới (required, min 6 ký tự)
    - `confirmPassword`: xác nhận mật khẩu mới (required, phải khớp với newPassword)
  - Validation:
    - Kiểm tra `oldPassword` không rỗng
    - `newPassword` phải khác `oldPassword`
    - `confirmPassword` phải khớp với `newPassword`
  - Khi submit:
    - Gọi `authApi.changePassword(oldPassword, newPassword)`
    - Backend kiểm tra `oldPassword` có đúng không, nếu đúng thì cập nhật `newPassword`
    - Hiển thị toast success và có thể redirect về trang trước

---

### 3.3.4 Tạo và chỉnh sửa CV

#### Tạo CV mới

- **Từ Dashboard (`Dashboard.tsx`)**:
  - Có nút "Create New Resume" hoặc "+ New Resume"
  - Khi bấm, hiển thị modal để nhập tên CV (title)
  - Sau khi nhập tên và submit:
    - Gọi `resumeApi.create({ title })` để tạo CV mới trên backend
    - Backend trả về CV mới với `id`
    - Redirect đến `/app/builder/:resumeId/edit` để bắt đầu chỉnh sửa

#### Chỉnh sửa nội dung theo step

- **Trang Resume Builder (`ResumeBuilder.tsx`)**:
  - Giao diện chia làm 2 phần: **Form bên trái** và **Preview bên phải**
  - Form được chia thành các step/tab:
    1. **Personal Information** (`PersonalInfoForm.tsx`):
       - Full name, email, phone, address, date of birth, gender, profession, language, website
       - Upload avatar (component `UploadImage`)
    2. **Professional Summary** (`ProfessionalSummaryForm.tsx`):
       - Textarea để nhập summary
       - Có nút "AI Enhance" để tối ưu bằng AI
    3. **Experience** (`ExperienceForm.tsx`):
       - Form để thêm/sửa/xóa từng experience
       - Mỗi experience có: company, position, start date, end date, is current, description
       - Có nút "AI Enhance" cho từng description
    4. **Education** (`EducationForm.tsx`):
       - Form để thêm/sửa/xóa education
       - Mỗi education có: institution, degree, field, graduation date, GPA
    5. **Projects** (`ProjectForm.tsx`):
       - Form để thêm/sửa/xóa project
       - Mỗi project có: name, description, technologies (array)
       - Có nút "AI Enhance" cho description
    6. **Skills** (`SkillsForm.tsx`):
       - Input để nhập danh sách skills (có thể là tags hoặc comma-separated)
  - Sử dụng Ant Design `Form` với `Form.useForm()` để quản lý form state
  - Mỗi step có thể navigate bằng nút "Previous" / "Next" hoặc click vào tab
  - Form data được sync với `resumeData` state để preview cập nhật real-time

#### Thay đổi mẫu và font chữ

- **Template Selector (`TemplateSelector.tsx`)**:
  - Hiển thị grid các template có sẵn: Classic, Modern, Bold, Professional, Minimal, Minimal Image
  - Mỗi template có preview thumbnail
  - Khi chọn template, cập nhật `resumeData.template` và preview tự động thay đổi

- **Font Family Selector**:
  - Dropdown/Select với danh sách fonts: Inter, Times New Roman, Georgia, Arial, Helvetica, Calibri, Garamond, Cambria, Roboto, Poppins, Mulish, Nunito, Montserrat
  - Khi chọn font, cập nhật `resumeData.font_family`
  - Preview áp dụng font mới ngay lập tức thông qua CSS `font-family`

- **Color Picker (`ColorPicker.tsx`)**:
  - Component để chọn màu accent cho CV
  - Có thể là color picker với preset colors hoặc input hex
  - Khi chọn màu, cập nhật `resumeData.accent_color`
  - Preview áp dụng màu mới cho các phần như header, divider, bullet points...

#### Upload ảnh đại diện

- **Component UploadImage (`UploadImage.tsx`)**:
  - Hiển thị avatar hiện tại (nếu có) hoặc icon placeholder
  - Khi click vào, mở file picker (chỉ chấp nhận `image/jpeg`, `image/png`)
  - Sau khi chọn file:
    - Tạo preview bằng `URL.createObjectURL(file)`
    - Hiển thị preview ngay trên UI
    - Khi form submit, gọi API upload ảnh lên backend
  - Backend trả về URL của ảnh đã upload (ví dụ: `/api/v1/storage/local/<fileId>`)
  - URL này được lưu vào `resumeData.personal_info.image` hoặc `user.avatar`
  - Preview CV hiển thị ảnh từ URL này

---

### 3.3.5 Live Preview theo thời gian thực

#### Hiển thị CV song song khi chỉnh sửa

- **Component ResumePreview (`ResumePreview.tsx`)**:
  - Nhận props: `data` (Resume object), `template`, `accentColor`, `classes`
  - Render CV theo template đã chọn bằng cách gọi component template tương ứng:
    - `ClassicTemplate`, `ModernTemplate`, `BoldTemplate`, `ProfessionalTemplate`, `MinimalTemplate`, `MinimalImageTemplate`
  - Mỗi template component nhận `data` và `accentColor`, render HTML/CSS tương ứng
  - Preview được hiển thị ở bên phải màn hình (hoặc bên dưới trên mobile) trong `ResumeBuilder.tsx`

#### Tự động cập nhật nội dung

- **Cơ chế sync giữa Form và Preview**:
  - Trong `ResumeBuilder.tsx`, có state `resumeData` chứa toàn bộ dữ liệu CV
  - Form sử dụng Ant Design `Form.useWatch()` hoặc `onValuesChange` để lắng nghe thay đổi
  - Khi user nhập/chỉnh sửa trong form:
    - `onValuesChange` được trigger
    - Gọi hàm `buildResumeFromForm()` để convert form values sang format `Resume`
    - Cập nhật `resumeData` state
    - `ResumePreview` component nhận `resumeData` mới và tự động re-render
  - **Xử lý đặc biệt cho AI optimization**:
    - Khi AI optimize text (ví dụ: description trong Experience), form gọi `form.setFieldValue()` để cập nhật giá trị
    - Tuy nhiên `onValuesChange` có thể không trigger khi dùng `setFieldValue` trực tiếp
    - Giải pháp: tạo callback `syncResumeFromForm` và truyền xuống các form component
    - Sau khi AI optimize xong, form component gọi `onChangeWithAi?.()` để manually sync `resumeData`
    - Đảm bảo preview luôn cập nhật ngay sau khi AI trả kết quả

---

### 3.3.6 Tích hợp chức năng tối ưu nội dung CV bằng AI

#### Gửi nội dung CV tới BE

- **Trong các form component** (`ProfessionalSummaryForm.tsx`, `ExperienceForm.tsx`, `ProjectForm.tsx`):
  - Có nút "AI Enhance" hoặc icon Sparkles bên cạnh textarea
  - Khi bấm:
    - Lấy nội dung hiện tại từ form field (ví dụ: `professional_summary`, `description`)
    - Gọi `aiApi.optimizeText(text)` từ `lib/api.ts`
    - Backend gửi text đến Gemini API với prompt yêu cầu tối ưu
    - Hiển thị loading state trong khi chờ response

#### Hiển thị nội dung được AI tối ưu

- **Sau khi nhận response từ backend**:
  - Backend trả về JSON: `{ optimizedText: string }`
  - Frontend parse response và lấy `optimizedText`
  - Cập nhật giá trị vào form field bằng `form.setFieldValue(fieldName, optimizedText)`
  - Gọi callback `onChangeWithAi?.()` để sync với preview
  - Preview tự động cập nhật để hiển thị text mới

#### Cho phép người dùng chỉnh sửa và lưu

- **Sau khi AI optimize**:
  - Text được điền vào textarea, user có thể:
    - Giữ nguyên text AI đã optimize
    - Chỉnh sửa một phần
    - Xóa và nhập lại hoàn toàn
  - Khi user chỉnh sửa, form tự động sync với preview
  - Khi user bấm "Save" hoặc "Update":
    - Form validate dữ liệu
    - Gọi `resumeApi.update(resumeId, resumeData)` để lưu lên backend
    - Hiển thị toast success và có thể redirect về Dashboard hoặc ResumeDetail

---

### 3.3.7 Đánh giá CV dựa trên Job Description

#### Nhập JD

- **Trong trang ResumeDetail (`ResumeDetail.tsx`)**:
  - Có section "Score by Job Description" hoặc tương tự
  - Textarea để người dùng paste Job Description (JD)
  - Có thể có nút "Load from URL" hoặc "Paste JD" để nhập nhanh

#### Hiển thị điểm số phù hợp CV – JD

- **Khi bấm nút "Score" hoặc "Analyze"**:
  - Frontend build `resumeText` từ `resumeData`:
    - Convert CV thành plain text format: Name, Profession, Summary, Experience, Education, Projects, Skills
  - Gọi `aiApi.scoreResumeByJD(resumeText, jdText)`
  - Backend gửi CV và JD đến Gemini với prompt yêu cầu chấm điểm và phân tích
  - Response từ backend: `{ score: number, missingSkills: string[], weakSections: string[], suggestions: string[] }`
  - Hiển thị kết quả trong Modal (`ScoreHistoryModal.tsx` hoặc Modal tương tự):
    - **Điểm số**: hiển thị số điểm từ 0-100, có thể dùng Progress bar hoặc số lớn
    - **Missing Skills**: danh sách kỹ năng còn thiếu (hiển thị dạng tags hoặc list)
    - **Weak Sections**: các phần CV yếu (summary, experience, projects...)
    - **Suggestions**: danh sách gợi ý cải thiện (mỗi suggestion là một bullet point)

#### Gợi ý cải thiện

- **Trong Modal kết quả**:
  - Mỗi suggestion được hiển thị với icon và text
  - Có thể có nút "Apply suggestions" để tự động áp dụng một số gợi ý (nếu có tính năng này)
  - User có thể đóng modal và quay lại chỉnh sửa CV dựa trên gợi ý
  - Có thể lưu lịch sử điểm số để so sánh sau khi chỉnh sửa

---

### 3.3.8 Tạo nội dung hỗ trợ bằng AI

#### Tạo thư xin việc -> cho phép chỉnh sửa và download kết quả

- **Trang Cover Letter (`CoverLetter.tsx`)**:
  - Input để nhập Job Description (JD)
  - Segmented control để chọn tone: "Normal" (formal) hoặc "Friendly"
  - Nút "Generate Cover Letter" với icon Sparkles
  - Khi bấm Generate:
    - Build `resumeText` từ CV hiện tại (tương tự như Score by JD)
    - Gọi `aiApi.generateCoverLetter(resumeText, jdText, type)` với `type` là "normal" hoặc "friendly"
    - Backend gửi đến Gemini với prompt yêu cầu viết cover letter theo tone đã chọn
    - Response: `{ type: string, language: string, coverLetter: string }`
  - **Hiển thị kết quả**:
    - Textarea hoặc div hiển thị cover letter đã generate
    - User có thể chỉnh sửa trực tiếp trong textarea
  - **Download**:
    - Có nút "Download" với icon DownloadIcon
    - Khi bấm, convert text thành file `.txt` hoặc `.docx` và download
    - Hoặc có thể dùng thư viện như `jspdf` để export PDF (nếu có)

#### Tạo câu hỏi mô phỏng phỏng vấn -> Cho phép người dùng trả lời câu hỏi

- **Trang Mock Interview (`MockInterview.tsx`)**:
  - Input để nhập Job Description
  - Nút "Generate Questions" để tạo câu hỏi
  - Khi bấm:
    - Build `resumeText` từ CV
    - Gọi `aiApi.generateInterviewQuestions(resumeText, jdText)`
    - Response: `{ language: string, matchedPosition: string, questions: [{ type, question, expectedAnswer }] }`
  - **Hiển thị câu hỏi**:
    - Render danh sách questions, mỗi question có:
      - Tag hiển thị type (technical, behavioral, experience, situational, soft-skill)
      - Text câu hỏi
      - Collapsible section để xem "Expected Answer" / "Hint" (nếu có)
    - Mỗi question có textarea để user nhập câu trả lời
    - State `answers` lưu câu trả lời theo `questionId`
  - **Nút "Score Answers"**:
    - Chỉ enable khi tất cả questions đã được trả lời
    - Khi bấm:
      - Build `qaList` từ `questions` và `answers`: `[{ question, answer }]`
      - Gọi `aiApi.scoreInterviewAnswers(qaList)`
      - Backend gửi đến Gemini với prompt yêu cầu chấm điểm từng câu trả lời

#### Hiển thị kết quả

- **Sau khi chấm điểm**:
  - Response: `{ language: string, averageScore: number, results: [{ question, answer, score, comment, improvementSuggestions[] }], overallFeedback: string }`
  - Hiển thị kết quả:
    - **Average Score**: điểm trung bình (0-100), hiển thị số lớn và progress bar
    - **Results cho từng câu**:
      - Hiển thị lại question và answer của user
      - Điểm số từng câu (score)
      - Comment/Feedback cho câu trả lời đó
      - Improvement Suggestions (danh sách gợi ý cải thiện)
    - **Overall Feedback**: nhận xét tổng thể về toàn bộ buổi phỏng vấn mô phỏng
  - UI có thể dùng Collapse/Panel để hiển thị chi tiết từng câu, hoặc hiển thị dạng list với expand/collapse

---

### 3.3.9 Tối ưu CV theo JD

#### Áp dụng thay đổi trực tiếp vào CV

- **Trang Tailor By JD (`TailorByJD.tsx`)**:
  - Input để nhập Job Description
  - Nút "Analyze and Tailor" hoặc "Optimize CV"
  - Khi bấm:
    - Build `resumeText` từ CV hiện tại
    - Gọi `aiApi.tailorResumeByJD(resumeText, jdText)`
    - Backend gửi đến Gemini với prompt yêu cầu tailor CV theo JD
    - Response: `{ language, matchedPosition, summary: { original, optimized }, sections: [{ section, title, original, optimized, changes[] }], overallSuggestions[] }`
  - **Component TailoredResumePreview (`TailoredResumePreview.tsx`)**:
    - Hiển thị CV preview với các thay đổi AI đề xuất
    - Mỗi section có thay đổi được highlight
    - Có nút **Accept** và **Reject** cho từng section:
      - **Accept**: áp dụng `optimized` text vào CV
      - **Reject**: giữ nguyên `original` text
    - State `decisions` lưu quyết định của user cho từng section: `{ [sectionKey]: "accepted" | "rejected" | "pending" }`
    - Khi user Accept/Reject một section:
      - Cập nhật `decisions` state
      - Tự động cập nhật `currentResume` để preview thay đổi ngay lập tức
      - Gọi callback `onResumeChange(newResume)` để sync với parent component

#### Cập nhật preview sau khi tối ưu

- **Cơ chế real-time update**:
  - `TailoredResumePreview` sử dụng `useEffect` để watch `decisions` state
  - Khi `decisions` thay đổi:
    - Duyệt qua các sections trong `tailoredInfo`
    - Nếu section có `decision === "accepted"`, áp dụng `optimized` text
    - Nếu `decision === "rejected"` hoặc `"pending"`, giữ `original` text
    - Build `updatedResume` mới và set vào `currentResume` state
    - `ResumePreview` component nhận `currentResume` và re-render
  - Preview luôn hiển thị CV với các thay đổi đã được Accept, giữ nguyên các phần đã Reject
  - Khi user hài lòng với preview, có thể bấm "Save" để lưu CV đã được tailor lên backend

---

### 3.3.10 Quản lý và chia sẻ CV

#### Xuất CV ra PDF

- **Trong ResumeDetail (`ResumeDetail.tsx`)**:
  - Có nút "Download PDF" với icon DownloadIcon
  - Khi bấm:
    - Gọi `resumeApi.downloadPdf(resumeId)` từ `lib/api.ts`
    - Backend render CV thành PDF (có thể dùng thư viện như `puppeteer`, `pdfkit`, hoặc `jspdf` trên server)
    - Response là Blob với content-type `application/pdf`
    - Frontend tạo `<a>` element với `href` là Blob URL và `download` attribute
    - Trigger click để download file PDF
    - File name có thể là: `${resumeTitle}_${timestamp}.pdf`

#### In CV

- **Nút "Print"**:
  - Có thể dùng `window.print()` để mở dialog in của browser
  - Hoặc render CV trong một window mới và gọi `print()` trên window đó
  - CSS có thể có `@media print` để tối ưu layout khi in

#### Tạo link chia sẻ công khai

- **Component ShareDialog (`ShareDialog.tsx`)**:
  - Modal/Dialog hiển thị khi bấm nút "Share"
  - Có toggle switch để bật/tắt chế độ public:
    - Khi bật: gọi `resumeApi.setVisibility(resumeId, true)`
    - Khi tắt: gọi `resumeApi.setVisibility(resumeId, false)`
  - Khi CV ở chế độ public:
    - Backend trả về public URL: `/view/:resumeId` hoặc `/api/v1/resume/public/:resumeId`
    - Hiển thị URL trong input field (read-only)
    - Có nút "Copy" để copy URL vào clipboard
    - Có thể có các nút share lên social media (Facebook, Twitter, LinkedIn...) nếu tích hợp

#### Guest xem CV qua link

- **Trang Preview (`Preview.tsx`)**:
  - Route: `/view/:resumeId` (public route, không cần authentication)
  - Khi truy cập:
    - Gọi `resumeApi.publicDetail(resumeId)` để lấy CV công khai
    - Backend kiểm tra CV có `isPublic = true` không, nếu không thì trả 404/403
    - Nếu hợp lệ, render CV bằng `ResumePreview` component
    - Layout đơn giản, chỉ hiển thị CV, không có header/footer phức tạp
    - Có thể có nút "Back to home" để quay về landing page

---

### 3.3.11 Quản lý hình ảnh

#### Upload ảnh đại diện

- **Component UploadImage (`UploadImage.tsx`)**:
  - Hiển thị avatar hiện tại (nếu có) hoặc icon placeholder (User icon)
  - Khi click vào, trigger `<input type="file">` với `accept="image/jpeg, image/png"`
  - Sau khi chọn file:
    - Tạo preview bằng `URL.createObjectURL(file)` để hiển thị ngay
    - File được lưu trong component state (`imageFile`)
  - **Upload lên backend**:
    - Khi form submit (trong `PersonalInfoForm` hoặc `ResumeBuilder`):
      - Kiểm tra nếu `imageFile` là File object (chưa upload)
      - Tạo FormData và append file
      - Gọi API upload (có thể là `POST /storage/upload` hoặc tương tự)
      - Backend lưu file và trả về URL
      - URL được lưu vào `resumeData.personal_info.image` hoặc `user.avatar`
  - **Hiển thị trong Preview**:
    - Nếu `imageFile` là string (URL), hiển thị từ URL đó
    - Nếu là File object, hiển thị từ `URL.createObjectURL(file)`
    - Avatar được render trong CV template với class `rounded-full` và `object-cover`

#### Xóa / thay đổi ảnh đại diện

- **Xóa ảnh**:
  - Có thể có nút "Remove" hoặc icon X bên cạnh avatar
  - Khi bấm:
    - Set `imageFile` về `null`
    - Cập nhật form field về `null` hoặc empty string
    - Preview sẽ hiển thị placeholder icon thay vì avatar
    - Khi save, backend sẽ xóa URL avatar khỏi database

- **Thay đổi ảnh**:
  - Click vào avatar hiện tại sẽ mở file picker lại
  - Chọn file mới sẽ thay thế file cũ
  - Preview tự động cập nhật với ảnh mới
  - Khi save, upload file mới lên backend và cập nhật URL

---

**Tóm lại**, frontend được xây dựng với React và TypeScript, sử dụng Ant Design và TailwindCSS cho UI, tích hợp đầy đủ các tính năng AI từ backend, hỗ trợ đa ngôn ngữ, và cung cấp trải nghiệm người dùng mượt mà với live preview và real-time updates.
