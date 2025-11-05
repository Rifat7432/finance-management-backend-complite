import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';

// 🔹 Multer storage for temp staging
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (['image', 'video'].includes(file.fieldname)) {
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      cb(null, tempDir);
    } else {
      const otherDir = path.join(process.cwd(), 'uploads', file.fieldname || 'others');
      if (!fs.existsSync(otherDir)) fs.mkdirSync(otherDir, { recursive: true });
      cb(null, otherDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name =
      file.originalname.replace(ext, '').toLowerCase().split(' ').join('-') +
      '-' +
      Date.now();
    cb(null, name + ext);
  },
});

// 🔹 File filter
const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {
  const imageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg', 'image/webp', 'image/svg+xml'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg'];

  if (file.fieldname === 'image') {
    if (imageTypes.includes(file.mimetype)) cb(null, true);
    else cb(new AppError(StatusCodes.BAD_REQUEST, 'Invalid image format'));
  } else if (file.fieldname === 'video') {
    if (videoTypes.includes(file.mimetype)) cb(null, true);
    else cb(new AppError(StatusCodes.BAD_REQUEST, 'Invalid video format'));
  } else {
    cb(null, true); // allow other fields
  }
};

// 🔹 Export multer upload handler
const fileUploadHandler = () =>
  multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: filterFilter,
  }).fields([
    { name: 'image', maxCount: 10 },
    { name: 'video', maxCount: 5 },
    { name: 'thumbnail', maxCount: 5 },
    { name: 'logo', maxCount: 5 },
    { name: 'banner', maxCount: 5 },
    { name: 'audio', maxCount: 5 },
    { name: 'document', maxCount: 10 },
    { name: 'driverLicense', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'permits', maxCount: 1 },
  ]);

// 🔹 Move only images/videos → S3


export default fileUploadHandler;
