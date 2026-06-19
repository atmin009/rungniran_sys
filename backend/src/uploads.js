import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';

export const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.resolve('uploads');
const CARS_DIR = path.join(UPLOAD_ROOT, 'cars');

fs.mkdirSync(CARS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CARS_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const imageFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|gif|webp|avif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, png, gif, webp)'));
};

// car photos: up to 20 files, 8MB each
export const uploadCarImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
}).array('files', 20);

// spreadsheet upload kept in memory for parsing
export const uploadSheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('file');

export const publicUrl = (filename) => `/uploads/cars/${filename}`;
