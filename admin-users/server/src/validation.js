export function validateBody(body, editing = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return 'Dữ liệu không hợp lệ.';
  const allowed = ['hoten', 'email', 'matkhau', 'hinhanh'];
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    return 'Chỉ được dùng 4 trường email, matkhau, hoten, hinhanh.';
  if (
    typeof body.hoten !== 'string' ||
    body.hoten.trim().length < 2 ||
    body.hoten.trim().length > 100
  )
    return 'Họ tên cần 2–100 ký tự.';
  if (
    typeof body.email !== 'string' ||
    body.email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  )
    return 'Email không hợp lệ.';
  if (
    !(editing && (body.matkhau === '' || body.matkhau === undefined)) &&
    (typeof body.matkhau !== 'string' ||
      body.matkhau.length < 8 ||
      body.matkhau.length > 128)
  )
    return 'Mật khẩu cần 8–128 ký tự.';
  if (
    typeof body.hinhanh !== 'string' ||
    body.hinhanh.length > 200000 ||
    (body.hinhanh !== '' &&
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(body.hinhanh))
  )
    return 'Ảnh phải là JPEG base64, tối đa 200.000 ký tự.';
  if (body.hinhanh) {
    const bytes = Buffer.from(body.hinhanh.split(',')[1], 'base64');
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255)
      return 'Nội dung ảnh JPEG không hợp lệ.';
  }
  return '';
}
