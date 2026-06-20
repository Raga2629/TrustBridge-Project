import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, WebP, and PDF allowed.', 400), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadFields = upload.fields([
  { name: 'aadhaar',          maxCount: 1 },
  { name: 'selfie',           maxCount: 1 },
  { name: 'pan',              maxCount: 1 },
  { name: 'gst',              maxCount: 1 },
  { name: 'gstCertificate',   maxCount: 1 },
  { name: 'businessLicense',  maxCount: 1 },
  { name: 'registrationCert', maxCount: 1 },
  { name: 'images',           maxCount: 5 },
  { name: 'file',             maxCount: 1 },
]);

// Alias used by the service documents endpoint
export const uploadDocFields = uploadFields;
