import { api } from './apiClient';

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

export const uploadCmsImage = async (file: File, folderSegments: string[]) => {
  validateImageFile(file);

  const dataUrl = await readFileAsDataUrl(file);
  const { publicUrl } = await api.uploadCmsImage({
    dataUrl,
    contentType: file.type,
    fileName: file.name,
    folderSegments
  });

  return publicUrl;
};
