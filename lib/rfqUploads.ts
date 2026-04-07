import { api } from './apiClient';
import { RfqAttachment } from '../types';

export const RFQ_ATTACHMENT_INPUT_ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp'
].join(',');

const MAX_RFQ_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to encode RFQ attachment.'));
    };
    reader.onerror = () => reject(new Error('Failed to read RFQ attachment.'));
    reader.readAsDataURL(file);
  });

const validateRfqAttachment = (file: File) => {
  if (file.size > MAX_RFQ_ATTACHMENT_SIZE_BYTES) {
    throw new Error('Each RFQ attachment must be 15MB or smaller.');
  }

  if (!file.type) {
    throw new Error('Unsupported RFQ attachment type.');
  }
};

export const uploadRfqAttachment = async (file: File): Promise<RfqAttachment> => {
  validateRfqAttachment(file);

  const dataUrl = await readFileAsDataUrl(file);
  const { attachment } = await api.uploadRfqAttachment({
    dataUrl,
    contentType: file.type,
    fileName: file.name
  });

  return attachment;
};
