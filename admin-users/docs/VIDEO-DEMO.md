# Kịch bản video demo (4–6 phút)

Trước khi quay: chạy MongoDB/API/Expo, chuẩn bị 2 ảnh JPEG/PNG và tài khoản admin, không quay bước nhập mật khẩu setup. Không để lộ .env, connection string hoặc JWT secret. Có thể quay màn hình Android hoặc dùng OBS trên Windows với cửa sổ emulator.

| Thời gian | Thao tác | Lời thuyết minh gợi ý |
|---|---|---|
| 0:00–0:25 | Giới thiệu tên đề tài, công nghệ | “Em xây dựng ứng dụng quản lý người dùng cho admin bằng React Native Expo, Express và MongoDB.” |
| 0:25–0:55 | Đăng nhập sai một lần, sau đó đúng | “API kiểm tra tài khoản admin và cấp JWT. Các chức năng quản lý yêu cầu token hợp lệ.” |
| 0:55–1:45 | Thêm nguyenvana, vana@example.com, matkhau hợp lệ; chọn ảnh và lưu | “Người dùng có đúng bốn trường hoten, email, matkhau, hinhanh. Ảnh được thu nhỏ rồi lưu vào hinhanh.” |
| 1:45–2:15 | Xem danh sách, tìm vana; thử email trùng | “App hỗ trợ tìm kiếm và ngăn email trùng lặp.” |
| 2:15–3:00 | Sửa tên, thay ảnh, để trống matkhau rồi lưu | “Mật khẩu trống khi sửa nghĩa là giữ mật khẩu cũ. Có thể nhập mới để đổi.” |
| 3:00–3:35 | Xóa: Hủy lần đầu, xác nhận lần sau | “Xóa cần xác nhận để tránh thao tác nhầm.” |
| 3:35–4:20 | Thêm lại bản ghi mẫu; mở MongoDB Compass/Data Explorer | “MongoDB có bốn trường nghiệp vụ và khóa _id hệ thống. Password là scrypt hash với salt, không lưu plaintext.” |
| 4:20–4:50 | Đăng xuất, xem màn hình login | “Token chỉ giữ trong bộ nhớ app, đăng xuất sẽ xóa token trên thiết bị.” |
| 4:50–5:15 | Mở cấu trúc source và kết quả npm test | “Mã nguồn kèm README Windows, hướng dẫn cấu hình MongoDB và kiểm thử API.” |

Kiểm tra video có tiếng, chữ rõ và ảnh hiển thị. Upload YouTube chế độ Unlisted hoặc Google Drive cho phép người có link xem; kiểm tra bằng cửa sổ chưa đăng nhập. Điền URL thật vào báo cáo và README cá nhân. Không ghi “đã chạy Android/iOS” nếu video chỉ demo web.
