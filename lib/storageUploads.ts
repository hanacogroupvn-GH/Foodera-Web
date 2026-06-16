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

/* ── JD (Job Description) file uploads ── */

export const JD_FILE_INPUT_ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
].join(',');

const MAX_JD_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/**
 * Upload a JD file (PDF, DOC, DOCX, XLS, etc.) via the local server endpoint.
 * Returns { publicUrl, fileName }.
 */
export const uploadCareerJdFile = async (file: File): Promise<{ publicUrl: string; fileName: string }> => {
  if (file.size > MAX_JD_FILE_SIZE_BYTES) {
    throw new Error('Tệp JD phải nhỏ hơn 15MB.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Không thể đọc tệp.'));
    reader.readAsDataURL(file);
  });

  const result = await api.uploadCareerJd({
    dataUrl,
    contentType: file.type,
    fileName: file.name,
  });

  return { publicUrl: result.publicUrl, fileName: result.fileName };
};
