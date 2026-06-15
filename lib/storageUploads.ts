import { api } from './apiClient';
import { isCloudinaryConfigured, uploadToCloudinary } from './cloudinaryUpload';
import { compressImage } from './imageCompress';

export const CMS_IMAGE_INPUT_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,image/heic,image/heif';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;



const validateImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size must be 10MB or smaller.');
  }
};

/**
 * Upload a CMS image. Automatically compresses before upload.
 * Uses Cloudinary exclusively.
 */
export const uploadCmsImage = async (file: File, folderSegments: string[]) => {
  validateImageFile(file);

  // Compress image before upload (resize + convert to WebP)
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.82,
    outputType: 'image/webp',
  });

  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment configuration is missing. Image upload requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to be set.');
  }
  
  return uploadToCloudinary(compressed, folderSegments);
};
