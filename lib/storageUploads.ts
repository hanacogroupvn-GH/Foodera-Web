import { supabase } from './supabaseClient';

export const SUPABASE_IMAGE_BUCKET = import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || 'cms-images';
export const CMS_IMAGE_INPUT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,image/heic,image/heif';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp'
};

const slugifyPathSegment = (value: string, fallback = 'item') => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
};

const getFileExtension = (file: File) => {
  const extensionFromMime = IMAGE_EXTENSION_BY_MIME[file.type];
  if (extensionFromMime) return extensionFromMime;

  const extensionFromName = file.name.split('.').pop()?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return extensionFromName || 'bin';
};

const buildUploadPath = (segments: string[], file: File) => {
  const baseSegments = segments.filter(Boolean);
  const safeSegments = (baseSegments.length > 0 ? baseSegments : ['uploads']).map((segment, index) =>
    slugifyPathSegment(segment, index === 0 ? 'uploads' : 'item')
  );
  const uniqueName =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${safeSegments.join('/')}/${uniqueName}.${getFileExtension(file)}`;
};

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

  const path = buildUploadPath(folderSegments, file);
  const { error } = await supabase.storage.from(SUPABASE_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
