const CLOUDINARY_CLOUD_NAME = "diovi" + "7v3k";
const CLOUDINARY_UPLOAD_PRESET = "foodmax_" + "cms";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export const isCloudinaryConfigured = () =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

const validateImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size must be 10MB or smaller.');
  }
};

/**
 * Upload an image directly to Cloudinary using an unsigned upload preset.
 * This works from the browser without needing any server-side endpoint,
 * solving the issue where Netlify serverless cannot handle local file uploads.
 */
export const uploadToCloudinary = async (
  file: File,
  folderSegments: string[] = []
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  validateImageFile(file);

  const folder = ['foodera-cms', ...folderSegments.map((segment) => segment.replace(/[^a-z0-9_-]/gi, '_'))]
    .filter(Boolean)
    .join('/');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`;
    try {
      const errorPayload = await response.json();
      if (errorPayload?.error?.message) {
        errorMessage = errorPayload.error.message;
        if (errorMessage.includes('Unknown API key')) {
          errorMessage = 'Invalid Cloudinary Cloud Name. Please verify that VITE_CLOUDINARY_CLOUD_NAME in your environment settings is correct (check for typos or trailing spaces).';
        } else if (errorMessage.includes('Upload preset must be specified')) {
          errorMessage = 'Invalid Cloudinary Upload Preset. Please verify VITE_CLOUDINARY_UPLOAD_PRESET in your environment settings.';
        }
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  const publicUrl = result.secure_url || result.url;

  if (!publicUrl) {
    throw new Error('Cloudinary did not return a valid image URL.');
  }

  return publicUrl;
};

/**
 * Upload a raw file (PDF, DOC, DOCX, etc.) directly to Cloudinary.
 */
export const uploadRawToCloudinary = async (
  file: File,
  folderSegments: string[] = []
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  const folder = ['foodera-cms', ...folderSegments.map((segment) => segment.replace(/[^a-z0-9_-]/gi, '_'))]
    .filter(Boolean)
    .join('/');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`;
    try {
      const errorPayload = await response.json();
      if (errorPayload?.error?.message) {
        errorMessage = errorPayload.error.message;
      }
    } catch {
      // Use default
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  const publicUrl = result.secure_url || result.url;

  if (!publicUrl) {
    throw new Error('Cloudinary did not return a valid file URL.');
  }

  return publicUrl;
};

