export function validateUser(form, editing = false) {
  if (form.hoten.trim().length < 2 || form.hoten.trim().length > 100)
    return 'Họ tên cần từ 2 đến 100 ký tự.';
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ||
    form.email.trim().length > 254
  )
    return 'Email không hợp lệ.';
  if (
    (!editing || form.matkhau !== '') &&
    (form.matkhau.length < 8 || form.matkhau.length > 128)
  )
    return 'Mật khẩu cần từ 8 đến 128 ký tự.';
  if (form.hinhanh.length > 200000) return 'Ảnh quá lớn. Hãy chọn ảnh khác.';
  return '';
}
