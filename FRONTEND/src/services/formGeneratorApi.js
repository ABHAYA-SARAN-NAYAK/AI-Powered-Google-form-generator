import axios from 'axios';

// In production we typically serve the frontend from the same origin as the backend.
// In dev, VITE_API_BASE_URL is set to '/api' so Vite can proxy to the backend.
// Default to '/api' to match the Vite proxy when the env var is not present.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export const formGeneratorApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

/**
 * Generate a Google Form via AI.
 * Sends as multipart/form-data when a qrImage file is attached,
 * otherwise sends as regular JSON.
 */
export async function generateForm({ prompt, formType, audience, language, tone, qrImage }) {
  if (qrImage) {
    // Multipart — includes the QR image file
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('formType', formType);
    formData.append('audience', audience);
    formData.append('language', language);
    formData.append('tone', tone);
    formData.append('qrImage', qrImage);

    const { data } = await formGeneratorApi.post('/generate-form', formData);
    return data;
  }

  // Regular JSON — no QR image
  const { data } = await formGeneratorApi.post('/generate-form', {
    prompt, formType, audience, language, tone
  });
  return data;
}

export async function extractFromImages({ images }) {
  const files = Array.isArray(images) ? images : [];
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const { data } = await formGeneratorApi.post('/extract-from-images', formData);
  return data;
}
