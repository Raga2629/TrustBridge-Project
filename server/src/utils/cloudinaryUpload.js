import cloudinary from '../config/cloudinary.js';
import { AppError } from './AppError.js';

export const uploadToCloudinary = async (buffer, folder = 'trustbridge') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return `https://placehold.co/400x300?text=TrustBridge+Upload`;
  }

  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key Exists:", !!process.env.CLOUDINARY_API_KEY);
  console.log("API Secret Exists:", !!process.env.CLOUDINARY_API_SECRET);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary Error:", error);
          return reject(new AppError(error.message, 500));
        }

        console.log("✅ Cloudinary Upload Success:", result.secure_url);
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

export const uploadMultiple = async (files, folder) => {
  if (!files?.length) return [];
  return Promise.all(files.map((f) => uploadToCloudinary(f.buffer, folder)));
};