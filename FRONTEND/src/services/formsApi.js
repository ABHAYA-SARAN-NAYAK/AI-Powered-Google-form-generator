import { formGeneratorApi } from './formGeneratorApi';

export async function listMyForms() {
  const { data } = await formGeneratorApi.get('/forms');
  return data;
}

export async function getMyForm(formId) {
  const { data } = await formGeneratorApi.get(`/forms/${encodeURIComponent(formId)}`);
  return data;
}

/**
 * Update a form. Sends as multipart when imageFiles are present,
 * otherwise sends as regular JSON.
 * @param {string} formId
 * @param {object} payload - { title, description, items[], questions[] }
 * @param {object} imageFiles - Map of index → File (e.g. { "image_3": File })
 */
export async function updateMyForm(formId, payload, imageFiles = {}) {
  const hasImages = Object.keys(imageFiles).length > 0;

  if (hasImages) {
    const formData = new FormData();
    formData.append('title', payload.title || '');
    if (payload.description != null) formData.append('description', payload.description);
    if (payload.formType) formData.append('formType', payload.formType);
    if (payload.items) formData.append('items', JSON.stringify(payload.items));
    if (payload.questions) formData.append('questions', JSON.stringify(payload.questions));

    for (const [fieldname, file] of Object.entries(imageFiles)) {
      formData.append(fieldname, file);
    }

    const { data } = await formGeneratorApi.put(`/forms/${encodeURIComponent(formId)}`, formData);
    return data;
  }

  const { data } = await formGeneratorApi.put(`/forms/${encodeURIComponent(formId)}`, payload);
  return data;
}

export async function deleteMyForm(formId) {
  const { data } = await formGeneratorApi.delete(`/forms/${encodeURIComponent(formId)}`);
  return data;
}

export async function bulkArchiveMyForms({ formIds, archived = true }) {
  const { data } = await formGeneratorApi.post('/forms/bulk/archive', { formIds, archived });
  return data;
}

export async function aiEditMyForm(formId, { prompt, currentForm, targetLanguage }) {
  const { data } = await formGeneratorApi.post(`/forms/${encodeURIComponent(formId)}/ai-edit`, {
    prompt,
    currentForm,
    targetLanguage
  });
  return data;
}

export async function detectFormLanguage({ texts }) {
  const { data } = await formGeneratorApi.post('/detect-language', { texts });
  return data;
}

export async function translateFormTexts({ texts, targetLanguage }) {
  const { data } = await formGeneratorApi.post('/translate', { texts, targetLanguage });
  return data;
}

export async function optimizeMyForm(formId, { items, targetAudience, language } = {}) {
  const targetId = formId ? encodeURIComponent(formId) : 'draft';
  const { data } = await formGeneratorApi.post(`/forms/${targetId}/optimize`, {
    items,
    targetAudience,
    language
  });
  return data;
}

