import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploadsRoot = path.join(serverRoot, 'uploads');
const placesUploadDir = path.join(uploadsRoot, 'places');

dotenv.config({ path: path.join(serverRoot, '.env') });

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'huruspaces',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1400, height: 1000, crop: 'limit' }],
      },
    })
  : multer.diskStorage({
      destination: (_req, _file, callback) => {
        fs.mkdirSync(placesUploadDir, { recursive: true });
        callback(null, placesUploadDir);
      },
      filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const safeBaseName = path
          .basename(file.originalname || 'place-image', extension)
          .replace(/[^a-z0-9_-]+/gi, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}-${safeBaseName || 'place-image'}${extension || '.jpg'}`;

        callback(null, uniqueName);
      },
    });

export const upload = multer({
  storage,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadsStaticRoot = uploadsRoot;

export const extractUploadedImageUrls = (files = [], req) =>
  files
    .map((file) => {
      if (file.path?.startsWith('http')) {
        return file.path;
      }

      if (file.secure_url) {
        return file.secure_url;
      }

      if (file.filename && req) {
        return `${req.protocol}://${req.get('host')}/uploads/places/${file.filename}`;
      }

      return '';
    })
    .filter(Boolean);
