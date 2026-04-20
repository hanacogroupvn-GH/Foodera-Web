import { api } from './apiClient';
import { isCloudinaryConfigured, uploadToCloudinary } from './cloudinaryUpload';

export const CMS_IMAGE_INPUT_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,image/heic,image/heif';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to encode image for upload.'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

const validateImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size must be 10MB or smaller.');
  }
};

/**
 * Upload a CMS image. Uses Cloudinary when configured (production),
 * falls back to local server endpoint for development.
 */
export const uploadCmsImage = async (file: File, folderSegments: string[]) => {
  validateImageFile(file);

  // Try Cloudinary first (works on both local and production)
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file, folderSegments);
  }

  // Fall back to local server upload (dev only)
  const dataUrl = await readFileAsDataUrl(file);
  const { publicUrl } = await api.uploadCmsImage({
    dataUrl,
    contentType: file.type,
    fileName: file.name,
    folderSegments
  });

  return publicUrl;
};

