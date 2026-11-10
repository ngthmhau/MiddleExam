import mongoose from 'mongoose';
import { createApp } from './app.js';
const {
  MONGODB_URI,
  ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH,
  JWT_SECRET,
  PORT = 4000,
  CORS_ORIGINS = '',
} = process.env;
if (
  !MONGODB_URI ||
  !ADMIN_EMAIL ||
  !/^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(ADMIN_PASSWORD_HASH || '') ||
  !JWT_SECRET ||
  JWT_SECRET.length < 32
) {
  console.error(
    'Thiếu cấu hình: chạy npm run setup rồi điền MONGODB_URI trong server/.env.',
  );
  process.exit(1);
}
try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const { User } = await import('./model.js');
  await User.init(); // Build unique indexes before accepting writes.
  const app = createApp({
    adminEmail: ADMIN_EMAIL.toLowerCase(),
    adminPasswordHash: ADMIN_PASSWORD_HASH,
    jwtSecret: JWT_SECRET,
    origins: CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  });
  app.listen(Number(PORT), '0.0.0.0', () =>
    console.log(`API đang chạy ở cổng ${PORT}. MongoDB đã kết nối.`),
  );
} catch (error) {
  console.error('Loại lỗi:', error.name);
  console.error('Mã lỗi:', error.code);
  console.error('Mã lỗi bên trong:', error.cause?.code);
  console.error('Thao tác lỗi:', error.syscall);
  console.error(
    'Không khởi động được server. Kiểm tra kết nối Atlas và cấu hình server/.env.',
  );
  process.exit(1);
}
