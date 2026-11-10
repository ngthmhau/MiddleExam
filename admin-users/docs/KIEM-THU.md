# Kết quả kiểm tra bàn giao

## Cập nhật 10/11/2026 — tên trường tiếng Việt

- App, API, schema và kiểm tra dữ liệu hiện dùng `email`, `matkhau`, `hoten`, `hinhanh`. `matkhau` vẫn lưu hash scrypt và không trả về qua API.
- Đã chuyển 4 tài liệu Atlas trong transaction; giữ nguyên `_id`, email, hash mật khẩu và ảnh. Đã bỏ index username cũ; email vẫn duy nhất, họ tên được phép trùng.
- Bộ kiểm thử mới: **6 test qua, 0 lỗi**, gồm CRUD, hash, xác thực, phân trang, từ chối tên trường cũ, tìm họ tên có dấu và cho phép trùng họ tên.
- Đã kiểm tra trực tiếp Atlas: 4 tài liệu có đúng 4 trường nghiệp vụ mới; GET `/api/users` trả 200 và không trả mật khẩu/hash.

Các kết quả phía dưới là lần kiểm tra bàn giao ban đầu, trước khi đổi tên trường.

Ngày kiểm tra: 07/11/2026. Môi trường Windows, Node.js 24.15.0, Expo SDK 58.

## Đã thực hiện

- `npm test` trong server: **5 test qua, 0 lỗi**, chạy với MongoDB tạm độc lập. Bao gồm hash/salt, đăng nhập và chặn truy cập không quyền, CRUD đầy đủ, đúng 4 trường nghiệp vụ + `_id`, không lộ hash, giữ/đổi password, lưu ảnh, dữ liệu lỗi, trùng lặp, tìm kiếm và phân trang.
- `expo export --platform web`: bundle web thành công.
- `expo export --platform android`: bundle Android/Hermes thành công. Đây là kiểm tra đóng gói JavaScript, không phải đã cài APK/chạy trên điện thoại.
- `expo install --check`: khớp dependency map cục bộ của SDK 58; lần kiểm tra này không truy cập được endpoint kiểm tra phiên bản online.
- Kiểm tra giao diện web với Express và MongoDB tạm thật: đăng nhập admin, xem danh sách, mở form, chọn ảnh PNG, chuyển JPEG, lưu hồ sơ và hiển thị ảnh trong danh sách. Ảnh chụp: `screenshots/danh-sach.jpg`. Dữ liệu chỉ là dữ liệu mẫu.
- Server cài dependencies: npm audit không báo lỗ hổng tại thời điểm cài. App có 5 cảnh báo mức moderate liên quan chuỗi công cụ Expo/glob/minimatch; không dùng `audit fix --force` vì đề xuất hạ SDK lớn và có thể làm mất tương thích. Kiểm tra lại khi cập nhật Expo; không coi đây là hệ thống đã kiểm toán bảo mật để đưa vào production.

## Cần kiểm tra trên môi trường của sinh viên

Connection string MongoDB của bạn chưa được cung cấp nên chưa thử Atlas/local DB riêng. Chưa chạy trực tiếp trên Android/iPhone; cần kiểm tra Expo Go tương thích SDK, quyền ảnh, kết nối Wi-Fi và bàn phím trên thiết bị thật.

1. Tạo cấu hình admin, điền MongoDB URI và API URL theo README.
2. Mở `/health` từ điện thoại trước khi quét QR, bảo đảm API truy cập được.
3. Đăng nhập sai/đúng; thêm bản ghi có và không có ảnh.
4. Chọn/hủy chọn/thay/bỏ ảnh; kiểm tra ảnh vẫn hiển thị sau khi tải lại app.
5. Thử username ngắn, email sai, password ngắn, email trùng và username trùng.
6. Sửa dữ liệu: password trống giữ hash cũ; password mới tạo hash mới.
7. Hủy xóa rồi xác nhận xóa, đối chiếu MongoDB.
8. Tìm không có kết quả, thêm hơn 20 hồ sơ để kiểm tra phân trang nếu cần.
9. Tắt API, kiểm tra báo lỗi và thử tải lại khi API chạy.
10. Đăng xuất, tải lại app và kiểm tra phải đăng nhập lại.

Chỉ ghi kết quả thực tế vào báo cáo sau khi tự thực hiện. Không sử dụng ảnh web để khẳng định đã kiểm thử Android/iOS.
