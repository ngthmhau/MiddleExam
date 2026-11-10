# BÁO CÁO GIỮA KỲ — LẬP TRÌNH ĐA NỀN TẢNG

> Phiên bản hiện tại dùng `email`, `matkhau`, `hoten`, `hinhanh` theo yêu cầu cập nhật. Cần đối chiếu lại với yêu cầu tên trường trong đề ban đầu trước khi nộp.

**Đề tài:** Xây dựng phân hệ admin quản lý người dùng bằng React Native và MongoDB

Sinh viên: [Điền họ tên] · MSSV: [Điền MSSV] · Lớp: [Điền lớp] · Giảng viên: [Điền tên]

## 1. Mục tiêu và yêu cầu

Xây dựng ứng dụng đa nền tảng cho phép admin thêm, hiển thị, sửa và xóa người dùng. Ứng dụng cho phép chọn, lưu và hiển thị ảnh đại diện; có đăng nhập admin. Dữ liệu lưu MongoDB với đúng bốn trường nghiệp vụ hoten, email, matkhau, hinhanh. Sản phẩm gồm mã nguồn GitHub, báo cáo các bước thực hiện và video demo.

## 2. Công nghệ và kiến trúc

Frontend dùng React Native với Expo, ngôn ngữ JavaScript. Backend dùng Node.js, Express và Mongoose. Dữ liệu lưu MongoDB. Admin đăng nhập bằng tài khoản cấu hình trên server và nhận JWT; các API quản lý chỉ được gọi với token hợp lệ.

```text
Admin → App Expo → HTTP API Express → Mongoose → MongoDB / users
                   │
                   ├── Xác thực JWT
                   ├── Kiểm tra dữ liệu
                   └── Băm matkhau bằng scrypt
```

Ảnh từ thư viện thiết bị được thu nhỏ/nén JPEG trên app, chuyển thành data URI và lưu trong trường hinhanh. App không kết nối MongoDB trực tiếp; connection string chỉ có trên server.

## 3. Thiết kế cơ sở dữ liệu

| Trường | Kiểu | Ràng buộc |
|---|---|---|
| hoten | String | Bắt buộc, 2–100 ký tự; có thể trùng tên |
| email | String | Bắt buộc, email hợp lệ, lowercase, unique |
| matkhau | String | Scrypt hash có salt và tham số trong cùng chuỗi |
| hinhanh | String | JPEG base64 hoặc chuỗi rỗng, tối đa 200.000 ký tự |

MongoDB tự sinh `_id` làm khóa định danh tài liệu. Không tự bổ sung trường nghiệp vụ. Tắt `__v`, `timestamps`; không tạo collection admin. Tài khoản admin nằm trong cấu hình môi trường riêng của server.

Mật khẩu không lưu dạng plaintext. Hàm scrypt tạo hash với salt ngẫu nhiên, định dạng `scrypt$32768$8$3$salt$hash`. Khi sửa mà không nhập mật khẩu mới, server giữ hash cũ. API không trả mật khẩu/hash về frontend; giao diện chỉ hiển thị dấu chấm.

## 4. Các bước thực hiện

### 4.1 Chuẩn bị môi trường

Cài Node.js 24 LTS, VS Code, Git và Expo Go. Chuẩn bị MongoDB Atlas hoặc MongoDB local. Giải nén/mở thư mục dự án.

**Ảnh 1 cần bổ sung:** phiên bản Node.js/npm trên Windows.

### 4.2 Cài đặt và kết nối backend

```powershell
cd server
npm ci
npm run setup
```

Nhập email/mật khẩu admin, sau đó tự điền `MONGODB_URI` vào server/.env. Chạy `npm start`. Server kết nối MongoDB và tạo unique indexes trước khi nhận yêu cầu.

**Ảnh 2 cần bổ sung:** terminal thông báo kết nối MongoDB thành công. Không chụp URI, JWT secret, mật khẩu.

### 4.3 Cài đặt frontend

Trong terminal mới ở thư mục app:

```powershell
npm ci
Copy-Item .env.example .env
ipconfig
npx expo start --clear
```

Đặt EXPO_PUBLIC_API_URL bằng IP Wi-Fi của máy Windows và cổng 4000. Điện thoại cùng Wi-Fi quét QR bằng Expo Go.

**Ảnh 3 cần bổ sung:** màn hình đăng nhập trên điện thoại, không để lộ mật khẩu.

### 4.4 Xây dựng đăng nhập

App gửi email/matkhau tới POST /api/auth/login. Server so sánh hash scrypt và email cấu hình; thành công trả JWT hết hạn sau 2 giờ. Token chỉ nằm trong bộ nhớ app. Middleware kiểm tra chữ ký, thuật toán, issuer, audience và quyền admin trước khi cho phép CRUD.

### 4.5 Thêm và hiển thị người dùng

Admin nhập hoten, email, matkhau và chọn ảnh tùy chọn. App kiểm tra form, thu nhỏ ảnh; server kiểm tra lại, băm mật khẩu và tạo tài liệu MongoDB. Danh sách hiển thị hoten/email/ảnh, mật khẩu được che. Danh sách có tìm kiếm, phân trang và tải lại.

**Ảnh 4–5 cần bổ sung:** form thêm có ảnh; danh sách sau khi lưu.

### 4.6 Sửa và xóa

Form sửa điền sẵn hoten/email/hinhanh, không điền lại mật khẩu. Để trống matkhau để giữ nguyên hoặc nhập mới để đổi. Nút Xóa hiển thị hộp xác nhận trước khi gọi DELETE API.

**Ảnh 6–7 cần bổ sung:** hồ sơ sau sửa; hộp xác nhận và danh sách sau xóa.

### 4.7 Kiểm tra dữ liệu MongoDB

Dùng Atlas Data Explorer hoặc MongoDB Compass xem collection users. Kiểm tra tài liệu chỉ có `_id` hệ thống và bốn trường của đề; matkhau là hash; hinhanh là data URI JPEG. Khi chụp chỉ mở phần đầu của hinhanh và không để lộ connection string.

**Ảnh 8 cần bổ sung:** tài liệu thực tế trong MongoDB.

## 5. API chính

POST /api/auth/login đăng nhập; GET /api/users lấy danh sách; POST /api/users thêm; PUT /api/users/:id sửa; DELETE /api/users/:id xóa. Các API users bắt buộc JWT. Lỗi dữ liệu trả 400, chưa xác thực 401, không tồn tại 404, trùng dữ liệu 409.

## 6. Kiểm thử

Chạy `npm test` tại server. Bộ kiểm thử tạo MongoDB tạm độc lập, kiểm tra hash/salt, đăng nhập, chặn truy cập không token, CRUD, cấu trúc tài liệu, không trả hash, giữ/đổi matkhau, ảnh, trùng dữ liệu, trường ngoài đề và phân trang. Xem kết quả bàn giao trong KIEM-THU.md.

Sau khi kết nối database của sinh viên, cần thực hiện checklist thủ công trên thiết bị và ghi kết quả thực tế; không coi kiểm thử tự động là bằng chứng đã chạy trên điện thoại.

| Tình huống | Kỳ vọng | Kết quả thực tế |
|---|---|---|
| Đăng nhập đúng/sai | Vào danh sách/báo lỗi | [Điền] |
| Thêm đủ thông tin và ảnh | Lưu MongoDB, hiện ảnh | [Điền] |
| Họ tên/email trùng | Báo lỗi, không tạo trùng | [Điền] |
| Sửa không đổi matkhau | Giữ hash cũ | [Điền] |
| Sửa matkhau mới | Hash mới | [Điền] |
| Hủy/chấp nhận xóa | Giữ/xóa tài liệu | [Điền] |
| Đăng xuất rồi truy cập API | Cần đăng nhập lại | [Điền] |
| Tắt server | Thông báo lỗi kết nối | [Điền] |

## 7. Kết luận và hướng phát triển

Ứng dụng được thiết kế để đáp ứng CRUD, chọn/hiển thị ảnh, đăng nhập admin và lưu MongoDB trong giới hạn bốn trường. Bảo vệ mật khẩu bằng scrypt và bảo vệ API bằng JWT. Khi hoàn thiện báo cáo, bổ sung kết quả chạy thực tế, ảnh minh họa và link nộp bài.

Giới hạn: một admin cấu hình ngoài DB, chưa đăng nhập dành cho người dùng được quản lý, ảnh thu nhỏ lưu base64, chưa thu hồi JWT từng phiên. Có thể phát triển HTTPS khi triển khai, cơ chế reset mật khẩu, quản lý nhiều admin nếu đề cho phép mở rộng dữ liệu.

## 8. Liên kết nộp bài

- GitHub: [Điền URL repository thật]
- Video demo: [Điền URL video thật]
- Ngày thực hiện và thiết bị: [Điền thông tin thực tế]

Tài liệu tham khảo: Expo ImagePicker/ImageManipulator, Mongoose Connections, MongoDB Node.js Driver và Node.js Crypto (đường dẫn trong README).
