import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    email: { type: String, required: true, maxlength: 254, unique: true },
    matkhau: { type: String, required: true, select: false },
    hoten: { type: String, required: true, minlength: 2, maxlength: 100 },
    hinhanh: { type: String, default: '', maxlength: 200000 },
  },
  { versionKey: false, timestamps: false, strict: 'throw', collection: 'users' },
);
export const User = mongoose.model('User', schema);
