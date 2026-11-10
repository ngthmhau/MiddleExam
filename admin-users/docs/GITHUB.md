# Đưa bài lên GitHub và nộp bài

Tạo repository trống tên `react-native-admin-mongodb` trên GitHub của bạn, chưa thêm README để tránh xung đột. Thực hiện các lệnh dưới đây **trong thư mục admin-users**; nếu thư mục đang nằm trong repo khác, copy nó ra một thư mục riêng trước.

```powershell
git init
git add .
git status
```

Kiểm tra không có `.env`, `server/.env`, `node_modules`, ảnh cá nhân hoặc dữ liệu thật trong danh sách staged. `.env.example` và hai package-lock.json cần có.

```powershell
git commit -m "Build Expo admin user CRUD with MongoDB"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/react-native-admin-mongodb.git
git push -u origin main
```

Thay YOUR_USERNAME bằng tên thật, đăng nhập GitHub khi Git yêu cầu. Nếu origin đã tồn tại, dùng `git remote -v` để kiểm tra trước khi thay. Không đưa access token vào URL/README. Nếu lỡ push URI/secret, đổi ngay mật khẩu DB/JWT secret rồi xử lý lịch sử commit; chỉ xóa file ở commit sau không xóa bí mật khỏi lịch sử.

Mô tả repository gợi ý:

> Bài giữa kỳ React Native Expo + JavaScript: admin login, user CRUD, hinhanh picker, search/pagination; Express API + MongoDB, scrypt matkhau hashing, đúng 4 trường nghiệp vụ.

README có thể bổ sung tên sinh viên, MSSV, ảnh giao diện thực tế và link demo. Không đăng thông tin cá nhân ngoài yêu cầu của trường.

Danh sách nộp:

- Báo cáo: chuyển nội dung BAO-CAO.md sang Word/PDF theo mẫu lớp, bổ sung ảnh chạy thực tế và thông tin sinh viên.
- GitHub: URL repo có source app + server + README + .env.example, không có secret.
- Video: URL xem được, thể hiện đăng nhập, thêm/ảnh, danh sách, sửa, xóa, MongoDB.
- Tự clone repo vào thư mục mới và làm theo README một lần để kiểm tra khả năng tái chạy.

Không có repository/video được tạo hoặc đăng công khai tự động trong gói này; bạn tự đăng lên tài khoản của mình và điền link thật.
