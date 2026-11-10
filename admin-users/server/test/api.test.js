import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/model.js';
import { hashPassword, verifyPassword } from '../src/password.js';

let mongo, app, token;
const secret = 'test-only-secret-with-more-than-32-characters';
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.init();
  app = createApp({
    adminEmail: 'admin@example.com',
    adminPasswordHash: await hashPassword('AdminTest123!'),
    jwtSecret: secret,
    origins: ['http://localhost:8081'],
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', matkhau: 'AdminTest123!' });
  assert.equal(login.status, 200);
  token = login.body.token;
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
const auth = () => ({ Authorization: `Bearer ${token}` });
const payload = {
  hoten: 'nguyenvana',
  email: 'VANA@example.com',
  matkhau: 'Password123!',
  hinhanh: '',
};
test('hash uses random salt and verifies without plaintext', async () => {
  const first = await hashPassword('Example123!');
  const second = await hashPassword('Example123!');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('Example123!', first), true);
  assert.equal(await verifyPassword('wrong', first), false);
  assert.equal(await verifyPassword('Example123!', 'plaintext'), false);
});
test('login rejects wrong password and protected routes reject missing/invalid tokens', async () => {
  assert.equal(
    (
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', matkhau: 'wrong' })
    ).status,
    401,
  );
  for (const method of ['get', 'post', 'put', 'delete']) {
    const path =
      method === 'put' || method === 'delete'
        ? '/api/users/507f1f77bcf86cd799439011'
        : '/api/users';
    assert.equal((await request(app)[method](path).send(payload)).status, 401);
  }
  assert.equal(
    (await request(app).get('/api/users').set('Authorization', 'Bearer fake')).status,
    401,
  );
});
test('CRUD persists exactly four business fields; preserves/changes hashed password; never exposes hash', async () => {
  const created = await request(app).post('/api/users').set(auth()).send(payload);
  assert.equal(created.status, 201);
  assert.equal(created.body.matkhau, undefined);
  const id = created.body._id;
  const raw = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
  assert.deepEqual(
    Object.keys(raw).sort(),
    ['_id', 'hoten', 'email', 'matkhau', 'hinhanh'].sort(),
  );
  assert.equal(raw.email, 'vana@example.com');
  assert.notEqual(raw.matkhau, payload.matkhau);
  assert.equal(await verifyPassword(payload.matkhau, raw.matkhau), true);
  let list = await request(app).get('/api/users?q=nguyen').set(auth());
  assert.equal(list.body.total, 1);
  assert.equal(list.body.items[0].matkhau, undefined);
  const updated = await request(app)
    .put(`/api/users/${id}`)
    .set(auth())
    .send({ ...payload, hoten: 'editeduser', matkhau: '' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.matkhau, undefined);
  let saved = await User.findById(id).select('+matkhau').lean();
  assert.equal(saved.matkhau, raw.matkhau);
  // A valid JPEG header is enough for this transport round-trip test.
  const hinhanh = 'data:image/jpeg;base64,/9j/2Q==';
  assert.equal(
    (
      await request(app)
        .put(`/api/users/${id}`)
        .set(auth())
        .send({ ...payload, matkhau: 'Changed123!', hinhanh })
    ).status,
    200,
  );
  saved = await User.findById(id).select('+matkhau').lean();
  assert.equal(saved.hinhanh, hinhanh);
  assert.equal(await verifyPassword('Changed123!', saved.matkhau), true);
  assert.equal(await verifyPassword(payload.matkhau, saved.matkhau), false);
  const duplicate = await request(app).post('/api/users').set(auth()).send(payload);
  assert.equal(duplicate.status, 409);
  assert.equal((await request(app).delete(`/api/users/${id}`).set(auth())).status, 204);
  assert.equal(await User.countDocuments(), 0);
  assert.equal((await request(app).delete(`/api/users/${id}`).set(auth())).status, 404);
});
test('validation rejects extra fields, injection, raw non-images, oversize image and bad IDs', async () => {
  for (const data of [
    { ...payload, role: 'admin' },
    { ...payload, hoten: { $ne: null } },
    { ...payload, matkhau: 'short' },
    { ...payload, email: 'bad' },
    { ...payload, hinhanh: 'data:image/jpeg;base64,YWJj' },
    { ...payload, hinhanh: 'a'.repeat(200001) },
  ]) {
    assert.equal(
      (await request(app).post('/api/users').set(auth()).send(data)).status,
      400,
    );
  }
  assert.equal(
    (await request(app).put('/api/users/bad-id').set(auth()).send(payload)).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post('/api/users')
        .set(auth())
        .send({ ...payload, hinhanh: 'a'.repeat(400000) })
    ).status,
    413,
  );
  assert.equal((await request(app).get('/api/users?q=%5B').set(auth())).status, 200);
});
test('Vietnamese schema allows shared full names and rejects legacy field names', async () => {
  const first = await request(app)
    .post('/api/users')
    .set(auth())
    .send({
      hoten: 'Nguyễn Văn An',
      email: 'an1@example.com',
      matkhau: 'Password123!',
      hinhanh: '',
    });
  const second = await request(app)
    .post('/api/users')
    .set(auth())
    .send({
      hoten: 'Nguyễn Văn An',
      email: 'an2@example.com',
      matkhau: 'Password123!',
      hinhanh: '',
    });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  const legacy = await request(app)
    .post('/api/users')
    .set(auth())
    .send({
      username: 'olduser',
      email: 'old@example.com',
      password: 'Password123!',
      image: '',
    });
  assert.equal(legacy.status, 400);
  const listed = await request(app)
    .get('/api/users?q=' + encodeURIComponent('Nguyễn Văn An'))
    .set(auth());
  assert.equal(listed.body.total, 2);
  assert.equal(
    listed.body.items.some((user) => 'matkhau' in user || 'password' in user),
    false,
  );
  await User.deleteMany({ email: { $in: ['an1@example.com', 'an2@example.com'] } });
});
test('pagination and search return the requested page', async () => {
  const hash = await hashPassword('Password123!');
  await User.insertMany(
    Array.from({ length: 21 }, (_, i) => ({
      hoten: `pageuser${i}`,
      email: `page${i}@example.com`,
      matkhau: hash,
      hinhanh: '',
    })),
  );
  const result = await request(app).get('/api/users?page=2&q=pageuser').set(auth());
  assert.equal(result.body.total, 21);
  assert.equal(result.body.pages, 2);
  assert.equal(result.body.items.length, 1);
  assert.equal(result.body.items[0].matkhau, undefined);
  await User.deleteMany({});
});
