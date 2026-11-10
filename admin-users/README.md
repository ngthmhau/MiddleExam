# People Desk — React Native + MongoDB

> Cập nhật theo yêu cầu ngày 10/11/2026: bốn trường nghiệp vụ hiện tại là `email`, `matkhau`, `hoten`, `hinhanh`. Tên trường đã đổi so với đề gốc. Dữ liệu cũ đã được đổi tên, giữ nguyên `_id`, email, hash mật khẩu và ảnh. Email là duy nhất; họ tên được phép trùng.

Ứng dụng giữa kỳ: phân hệ admin quản lý người dùng. JavaScript, Expo, Express, MongoDB/Mongoose. Giao diện tiếng Việt, tông tím, dùng được trên Android/iOS qua Expo Go và trình duyệt để thử nhanh.

## 1. Chức năng

- Đăng nhập admin bằng email/mật khẩu, JWT có hạn 2 giờ; đăng xuất.
- Thêm, xem danh sách, sửa, xóa người dùng; xác nhận trước khi xóa.
- Chọn ảnh trong thư viện, thu nhỏ JPEG, hiển thị ảnh, thay/bỏ ảnh.
- Tìm hoten/email, phân trang 20 người/trang, kéo để tải lại.
- Kiểm tra dữ liệu trên app và server, chặn email trùng, báo lỗi kết nối.
- Mật khẩu băm **scrypt với salt ngẫu nhiên trên server**, không lưu plaintext, không gửi hash về app.

## 2. Cơ sở dữ liệu: 4 trường theo yêu cầu cập nhật

Collection duy nhất của ứng dụng là `users`:

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| hoten | String | Họ tên 2–100 ký tự; được phép trùng tên |
| email | String | Email, chuẩn hóa chữ thường, không trùng |
| matkhau | String | `scrypt$32768$8$3$salt$hash`, không phải mật khẩu gốc |
| hinhanh | String | Data URI JPEG base64; chuỗi rỗng nếu không có ảnh |

MongoDB tự có khóa `_id` bắt buộc để định danh tài liệu; đây là khóa hệ thống, không phải trường nghiệp vụ tự bổ sung. Mongoose đã tắt `__v` và timestamps, không có `role`, `createdAt`, `updatedAt`, `salt` riêng. Salt và tham số scrypt nằm chung trong `matkhau`.

Admin nằm trong cấu hình **server/.env**, không tạo collection admin, không thêm trường role vào users. Người dùng được quản lý là dữ liệu CRUD, **không tự trở thành tài khoản đăng nhập**. Danh sách không hiển thị mật khẩu; ô nhập mật khẩu trong form được che. Không thể khôi phục mật khẩu gốc từ hash.

## 3. Chuẩn bị trên Windows

1. Cài **Node.js 24 LTS** từ https://nodejs.org/ và VS Code; cài Git nếu muốn đưa lên GitHub.
2. Cài Expo Go trên điện thoại. Điện thoại và Windows dùng cùng Wi-Fi.
3. Có MongoDB Atlas hoặc MongoDB cài trên máy. Bạn **tự điền connection string sau**; mã nguồn không cần sửa.
4. Mở thư mục `admin-users` bằng VS Code → Terminal → New Terminal. Các lệnh dưới đây dùng PowerShell. Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` và `npx.cmd` thay cho `npm`, `npx`; không cần đổi chính sách Windows.

Kiểm tra:

```powershell
node --version
npm --version
```

## 4. Cài và cấu hình server (terminal số 1)

Từ thư mục `admin-users`:

```powershell
cd server
npm ci
npm run setup
```

Nhập email và mật khẩu admin của bạn (8–128 ký tự). Script tạo `server/.env`, tự sinh hash admin và JWT secret. Mật khẩu nhập trong terminal có hiển thị, nên thực hiện trước khi quay video. Không có tài khoản/mật khẩu mặc định. Nếu `.env` đã tồn tại, script không ghi đè. Muốn tạo lại admin, đổi tên `.env` cũ, chạy setup lại và chuyển URI sang file mới.

Mở **server/.env**, điền duy nhất dòng còn trống:

```dotenv
MONGODB_URI=mongodb+srv://DB_USER:DB_PASSWORD@YOUR_CLUSTER/admin_midterm?retryWrites=true&w=majority
```

URI trên chỉ minh họa. Dán chuỗi thật của bạn, giữ tên database `/admin_midterm` trước dấu `?`. Mật khẩu DB có ký tự đặc biệt cần URL-encode. Với MongoDB local đang chạy:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/admin_midterm
```

MongoDB Atlas: tạo cluster → Database Access tạo DB user có quyền đọc/ghi database bài tập → Network Access cho phép IP công cộng hiện tại của máy Windows → Connect → Drivers → copy URI. DB user khác với admin của ứng dụng. Không cần mở Atlas cho IP điện thoại vì chỉ server kết nối MongoDB.

Chạy server:

```powershell
npm start
```

Thành công khi terminal hiện `API đang chạy ở cổng 4000. MongoDB đã kết nối.` Server chưa chạy khi URI còn trống. Truy cập http://localhost:4000/health sẽ nhận `{"status":"ok"}`. Database/collection tự được tạo khi kết nối/tạo người dùng; không cần tạo bản ghi thủ công.

## 5. Cài và cấu hình app (terminal số 2)

Mở terminal mới ở thư mục **admin-users**, không ở `server`:

```powershell
npm ci
Copy-Item .env.example .env
ipconfig
```

Tìm `IPv4 Address` của adapter Wi-Fi, ví dụ `192.168.1.10`. Mở **admin-users/.env** và đặt:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000
```

Đây là **địa chỉ server Node.js**, tuyệt đối không đặt MongoDB URI trong app hoặc biến `EXPO_PUBLIC_*`. Các biến public được đóng gói vào app và ai cũng có thể đọc.

| Thiết bị chạy app | API URL |
|---|---|
| Điện thoại thật | `http://IP_WIFI_WINDOWS:4000` |
| Android Emulator chuẩn | `http://10.0.2.2:4000` |
| Trình duyệt cùng máy Windows | `http://localhost:4000` |

Chạy:

```powershell
npx expo start --clear
```

Quét QR bằng Expo Go trên Android; iPhone dùng Camera/Expo Go. Đăng nhập bằng email/mật khẩu đã tạo ở bước setup. Windows có thể chạy Android Emulator khi cài Android Studio; không chạy iOS Simulator trực tiếp trên Windows.

Muốn thử web ngay trên Windows:

```powershell
npm run web
```

Nếu Expo chọn cổng khác 8081, bổ sung origin đó vào `CORS_ORIGINS` của server, ngăn cách bởi dấu phẩy, rồi khởi động lại server. Khi thay `.env` của app, dừng Expo bằng Ctrl+C và chạy lại `npx expo start --clear`.

## 6. Cách sử dụng

1. Đăng nhập admin.
2. Nhấn **+ Thêm**, nhập hoten/email/matkhau, nhấn **Chọn ảnh**, chọn ảnh → **Lưu người dùng**.
3. Xem hồ sơ và ảnh trên danh sách, tìm theo hoten hoặc email.
4. Nhấn **Sửa**: thay dữ liệu/ảnh; matkhau để trống giữ hash cũ, nhập mật khẩu mới để đổi. Nhấn Lưu.
5. Nhấn **Xóa**, xác nhận hoặc Hủy.
6. Đăng xuất. Token chỉ nằm trong bộ nhớ; tải lại/tắt app cần đăng nhập lại.

Ảnh được thu nhỏ chiều rộng 320px, nén JPEG, giới hạn 200.000 ký tự (~150KB dữ liệu nhị phân). Lưu trực tiếp trong `hinhanh` để không cần thêm collection/file service. Phù hợp ảnh đại diện và bài tập; không dùng để lưu ảnh gốc dung lượng lớn.

## 7. Kiểm tra và cấu trúc

```text
admin-users/
  App.js                 Giao diện đăng nhập, danh sách, form, chọn ảnh
  src/validation.js      Kiểm tra form
  .env.example           Mẫu API URL cho app
  server/
    src/index.js         Đọc cấu hình, kết nối MongoDB, chạy API
    src/app.js           Login, xác thực JWT, CRUD, tìm kiếm, phân trang
    src/model.js         Schema chỉ 4 trường nghiệp vụ
    src/password.js      Scrypt hash/verify
    src/validation.js    Kiểm tra request, chặn trường ngoài đề
    scripts/setup.mjs    Tạo cấu hình admin
    test/api.test.js     Kiểm thử API trên MongoDB tạm
  docs/                  Nội dung báo cáo, kịch bản video, hướng dẫn GitHub
```

Kiểm thử tự động (trong `server`):

```powershell
npm test
```

Lần đầu cần mạng để tải MongoDB binary phục vụ test. Test dùng MongoDB tạm, **không đọc MONGODB_URI**, không sửa database của bạn. Có kiểm tra login, quyền truy cập, CRUD, đúng 4 trường + `_id`, hash, đổi/giữ mật khẩu, ảnh, trùng dữ liệu, phân trang và dữ liệu lỗi.

Kiểm tra gói Expo (trong thư mục app):

```powershell
npx expo install --check
npx expo export --platform android --output-dir dist-android
```

Đọc `docs/KIEM-THU.md` về kết quả kiểm tra bàn giao và những bước bạn cần thử trên điện thoại thật sau khi kết nối MongoDB riêng.

## 8. API

Các đường dẫn `/api/users*` cần header `Authorization: Bearer TOKEN`. Không có API đăng ký admin công khai.

| Method | URL | Chức năng |
|---|---|---|
| POST | `/api/auth/login` | Nhận email/matkhau, trả token 2 giờ |
| GET | `/api/users?page=1&q=vana` | Danh sách không có matkhau/hash |
| POST | `/api/users` | Thêm với đúng 4 trường |
| PUT | `/api/users/:id` | Sửa; matkhau rỗng/không truyền giữ mật khẩu cũ |
| DELETE | `/api/users/:id` | Xóa |
| GET | `/health` | Kiểm tra server/DB |

POST/PUT gửi `hoten`, `email`, `matkhau`, `hinhanh`. Phản hồi thành công không trả `matkhau`. HTTP 400: dữ liệu sai; 401: sai login/hết phiên; 404: không tồn tại; 409: trùng; 413: quá lớn; 429: quá nhiều yêu cầu.

## 9. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Thiếu cấu hình server | Chạy `npm run setup`, điền `server/.env` |
| MongoDB không kết nối | Kiểm tra URI, matkhau DB, IP Atlas, mạng/DNS, DB local đang chạy |
| App báo không kết nối server | Server đang chạy? API URL là IPv4 đúng? Cùng Wi-Fi? Thử mở `/health` trên điện thoại |
| localhost trên điện thoại không được | localhost là chính điện thoại; thay bằng IP Windows |
| Điện thoại không mở được `/health` | Kiểm tra Wi-Fi có client isolation; cho phép Node.js trên mạng Private trong Windows Firewall, không tắt toàn bộ firewall |
| Quét QR được nhưng login lỗi mạng | Expo tunnel chỉ chuyển tiếp Expo, không chuyển tiếp API Node.js; kiểm tra riêng API URL |
| Web bị CORS | Thêm đúng origin của web vào `CORS_ORIGINS`, restart server |
| Email đã tồn tại | Dùng email khác; họ tên được phép trùng |
| Expo Go không tương thích SDK | Cập nhật Expo Go; dự án dùng SDK 58; dùng bản Expo Go hỗ trợ SDK này/dev build nếu cần |
| Không chọn được ảnh | Thử JPEG/PNG khác, kiểm tra quyền ảnh; ảnh chọn sẽ chuyển sang JPEG |

## 10. Bảo mật và giới hạn

- Giữ `server/.env` riêng, không commit; `.gitignore` đã bỏ qua `.env`, `node_modules`, bản build.
- JWT secret tự sinh; token giới hạn 2 giờ. Đăng xuất xóa token trên app; token đã sao chép vẫn có thể có hiệu lực đến hết hạn. Đổi JWT secret sẽ vô hiệu hóa token cũ.
- HTTP chỉ dùng thử trong mạng riêng. Khi đưa API lên Internet, dùng HTTPS và cấu hình origin phù hợp. MongoDB Atlas dùng kết nối TLS theo URI của Atlas.
- API có rate limit, Helmet, giới hạn body, kiểm tra kiểu dữ liệu, unique indexes. CORS chỉ bảo vệ trình duyệt; JWT mới là kiểm soát truy cập.
- Scrypt dùng N=32768, r=8, p=3, salt ngẫu nhiên 16 byte, hash 64 byte. Không mã hóa hai chiều, không có chức năng xem lại mật khẩu gốc.
- Một admin cấu hình ngoài DB; chưa có đăng ký người dùng, reset matkhau/email verification, audit log, thu hồi JWT từng phiên hoặc xử lý xung đột nhiều admin. Sửa đồng thời áp dụng lần lưu cuối. Đây là phạm vi bài tập.

## 11. Nộp bài

- `docs/BAO-CAO.md`: nội dung báo cáo có phần điền tên/lớp và vị trí bổ sung ảnh thật.
- `docs/VIDEO-DEMO.md`: kịch bản quay 4–6 phút.
- `docs/GITHUB.md`: lệnh đưa source lên GitHub, nội dung mô tả, danh sách cần nộp.
- Chỉ điền link GitHub/video thật sau khi bạn tạo repository và upload video; mã nguồn không chứa link giả.

## Tài liệu tham khảo

- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [Mongoose connections](https://mongoosejs.com/docs/connections.html)
- [MongoDB connection strings](https://www.mongodb.com/docs/drivers/node/current/connect/mongoclient/)
- [Node.js crypto](https://nodejs.org/api/crypto.html)
