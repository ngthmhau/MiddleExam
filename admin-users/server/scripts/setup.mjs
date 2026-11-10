import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { hashPassword } from '../src/password.js';
const io = createInterface({ input: process.stdin, output: process.stdout });
try {
  try {
    await readFile('.env');
    console.log('.env đã tồn tại. Giữ nguyên để không ghi đè cấu hình.');
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const email = (await io.question('Email admin: ')).trim().toLowerCase();
    console.log(
      'Nhập mật khẩu trong terminal riêng; ký tự sẽ hiển thị, đừng quay màn hình bước này.',
    );
    const password = await io.question('Mật khẩu admin (8–128 ký tự): ');
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 ||
      password.length > 128
    )
      throw new Error('Email/mật khẩu không hợp lệ. Chạy lại setup.');
    const template = await readFile('.env.example', 'utf8');
    const text = template
      .replace('ADMIN_EMAIL=admin@example.com', `ADMIN_EMAIL=${email}`)
      .replace(
        'ADMIN_PASSWORD_HASH=',
        `ADMIN_PASSWORD_HASH=${await hashPassword(password)}`,
      )
      .replace('JWT_SECRET=', `JWT_SECRET=${randomBytes(48).toString('hex')}`);
    await writeFile('.env', text, { flag: 'wx' });
    console.log('Đã tạo .env. Điền MONGODB_URI rồi chạy npm start.');
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  io.close();
}
