import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from './model.js';
import { hashPassword, verifyPassword } from './password.js';
import { validateBody } from './validation.js';

export function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.origins }));
  app.use(express.json({ limit: '300kb' }));
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { message: 'Quá nhiều yêu cầu. Thử lại sau một phút.' },
    }),
  );
  app.get('/health', (req, res) =>
    res.json({
      status: mongoose.connection.readyState === 1 ? 'ok' : 'database-disconnected',
    }),
  );
  app.post(
    '/api/auth/login',
    rateLimit({
      windowMs: 15 * 60000,
      limit: 10,
      message: { message: 'Đăng nhập quá nhiều lần. Thử lại sau 15 phút.' },
    }),
    async (req, res) => {
      const { email, matkhau } = req.body || {};
      if (
        typeof email !== 'string' ||
        typeof matkhau !== 'string' ||
        matkhau.length > 128
      )
        return res.status(400).json({ message: 'Email hoặc mật khẩu không hợp lệ.' });
      // Always derive the password, including when email is wrong.
      const valid = await verifyPassword(matkhau, config.adminPasswordHash);
      if (!valid || email.trim().toLowerCase() !== config.adminEmail)
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
      res.json({
        token: jwt.sign({ role: 'admin' }, config.jwtSecret, {
          subject: 'admin',
          issuer: 'admin-users-api',
          audience: 'admin-users-app',
          expiresIn: '2h',
          algorithm: 'HS256',
        }),
      });
    },
  );
  app.use('/api/users', (req, res, next) => {
    try {
      const token = (req.headers.authorization || '').replace(/^Bearer /, '');
      const claims = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'admin-users-api',
        audience: 'admin-users-app',
      });
      if (claims.sub !== 'admin' || claims.role !== 'admin') throw new Error();
      next();
    } catch {
      res
        .status(401)
        .json({ message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }
  });
  app.get('/api/users', async (req, res) => {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const q = String(req.query.q || '')
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = q
      ? {
          $or: [
            { hoten: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ _id: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .lean(),
      User.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / 20)) });
  });
  app.post('/api/users', async (req, res) => {
    const error = validateBody(req.body);
    if (error) return res.status(400).json({ message: error });
    const { hoten, email, matkhau, hinhanh } = req.body;
    const user = await User.create({
      hoten: hoten.trim(),
      email: email.trim().toLowerCase(),
      matkhau: await hashPassword(matkhau),
      hinhanh,
    });
    res.status(201).json({
      _id: user.id,
      hoten: user.hoten,
      email: user.email,
      hinhanh: user.hinhanh,
    });
  });
  app.put('/api/users/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
      return res.status(400).json({ message: 'ID không hợp lệ.' });
    const error = validateBody(req.body, true);
    if (error) return res.status(400).json({ message: error });
    const { hoten, email, matkhau, hinhanh } = req.body;
    const changes = {
      hoten: hoten.trim(),
      email: email.trim().toLowerCase(),
      hinhanh,
    };
    if (matkhau) changes.matkhau = await hashPassword(matkhau);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: changes },
      { returnDocument: 'after', runValidators: true },
    ).lean();
    if (!user) return res.status(404).json({ message: 'Người dùng đã bị xóa.' });
    res.json(user);
  });
  app.delete('/api/users/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
      return res.status(400).json({ message: 'ID không hợp lệ.' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Người dùng đã bị xóa.' });
    res.status(204).end();
  });
  app.use((error, req, res, next) => {
    if (error.code === 11000)
      return res.status(409).json({ message: 'Email đã tồn tại.' });
    if (error.type === 'entity.too.large')
      return res.status(413).json({ message: 'Ảnh hoặc dữ liệu quá lớn.' });
    if (error.type === 'entity.parse.failed')
      return res.status(400).json({ message: 'JSON không hợp lệ.' });
    if (error.name === 'ValidationError')
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
    res.status(500).json({
      message: 'Không thể xử lý yêu cầu. Kiểm tra kết nối MongoDB trên server.',
    });
  });
  return app;
}
