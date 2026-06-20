import cloudinary from '../config/cloudinary.js';
import { AppError } from './AppError.js';

export const uploadToCloudinary = async (buffer, folder = 'trustbridge') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return `https://placehold.co/400x300?text=TrustBridge+Upload`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(new AppError('File upload failed', 500));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

export const uploadMultiple = async (files, folder) => {
  if (!files?.length) return [];
  return Promise.all(files.map((f) => uploadToCloudinary(f.buffer, folder)));
};
