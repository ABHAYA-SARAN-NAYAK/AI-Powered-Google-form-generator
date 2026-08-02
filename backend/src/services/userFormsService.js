import { google } from 'googleapis';
import { Readable } from 'node:stream';
import { supabase } from './supabaseClient.js';
import { getOAuthClientForUser } from './googleOAuthService.js';
import { sanitizeFileUploadQuestion, sanitizeAllFileUploads } from '../utils/formHelpers.js';


async function selectFormMetadataForUser({ userId, formId }) {
  const base = 'google_form_id, google_form_url, edit_url, responder_url, title, description, form_type, audience, language, tone, created_at';

  const withArchived = await supabase
    .from('forms')
    .select(`${base}, archived`)
    .eq('user_id', userId)
    .eq('google_form_id', formId)
    .maybeSingle();

  if (!withArchived.error) return withArchived;

  if (withArchived.error?.code === '42703' && String(withArchived.error?.message || '').includes('archived')) {
    const withoutArchived = await supabase
      .from('forms')
      .select(base)
      .eq('user_id', userId)
      .eq('google_form_id', formId)
      .maybeSingle();

    if (!withoutArchived.error && withoutArchived.data) {
      return { ...withoutArchived, data: { ...withoutArchived.data, archived: false } };
    }
    return withoutArchived;
  }

  return withArchived;
}

/* =========================================================
   Sanitize display text (no newlines in Google Forms titles)
========================================================= */
function sanitizeDisplayText(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

/* =========================================================
   Map Google Form → unified editable items model
   Handles: questions, sections (pageBreakItem), images (imageItem), text (textItem)
========================================================= */
function mapGoogleFormToEditableModel(googleForm) {
  const info = googleForm?.info || {};
  const rawItems = Array.isArray(googleForm?.items) ? googleForm.items : [];

  const items = [];

  for (const item of rawItems) {
    // Section header (pageBreakItem)
    if (item?.pageBreakItem !== undefined) {
      items.push({
        kind: 'section',
        title: item?.title || '',
        description: item?.description || ''
      });
      continue;
    }

    // Image item (imageItem)
    if (item?.imageItem) {
      const sourceUri = item.imageItem?.image?.sourceUri || '';
      items.push({
        kind: 'image',
        title: item?.title || '',
        imageUrl: sourceUri
      });
      continue;
    }

    // Text item (textItem)
    if (item?.textItem !== undefined) {
      items.push({
        kind: 'text',
        title: item?.title || '',
        description: item?.description || ''
      });
      continue;
    }

    // Question item (questionItem)
    const qi = item?.questionItem;
    const q = qi?.question;
    if (!q) continue;

    const base = {
      kind: 'question',
      title: item?.title || '',
      required: !!q.required
    };

    if (q.textQuestion) {
      items.push({ ...base, type: q.textQuestion.paragraph ? 'paragraph' : 'short_text' });
      continue;
    }

    if (q.choiceQuestion) {
      const t = q.choiceQuestion.type;
      const choices = Array.isArray(q.choiceQuestion.options) ? q.choiceQuestion.options.map((o) => o?.value).filter(Boolean) : [];
      if (t === 'RADIO') items.push({ ...base, type: 'multiple_choice', choices });
      else if (t === 'CHECKBOX') items.push({ ...base, type: 'checkboxes', choices });
      else if (t === 'DROP_DOWN') items.push({ ...base, type: 'dropdown', choices });
      continue;
    }

    if (q.scaleQuestion) {
      items.push({
        ...base,
        type: 'linear_scale',
        scale: {
          min: q.scaleQuestion.low,
          max: q.scaleQuestion.high,
          minLabel: q.scaleQuestion.lowLabel || '',
          maxLabel: q.scaleQuestion.highLabel || ''
        }
      });
      continue;
    }

    if (q.dateQuestion) {
      items.push({ ...base, type: 'date' });
      continue;
    }

    if (q.timeQuestion) {
      items.push({ ...base, type: 'time' });
      continue;
    }
  }

  return {
    formId: googleForm?.formId,
    title: info.title || '',
    description: info.description || '',
    items,
    // Legacy: also expose questions-only view for backward compatibility
    questions: items.filter((it) => it.kind === 'question')
  };
}

/* =========================================================
   Build Google Forms batchUpdate request for a single item
========================================================= */


function toGoogleItemRequest(item, index, { isQuiz } = {}) {
  const kind = item.kind || 'question';

  // ── Section ──
  if (kind === 'section') {
    return {
      createItem: {
        location: { index },
        item: {
          title: sanitizeDisplayText(item.title || 'Untitled Section'),
          description: item.description || '',
          pageBreakItem: {}
        }
      }
    };
  }

  // ── Image ──
  if (kind === 'image') {
    if (!item.imageUrl) return null; // skip images without URL
    return {
      createItem: {
        location: { index },
        item: {
          title: sanitizeDisplayText(item.title || 'Image'),
          imageItem: {
            image: {
              sourceUri: item.imageUrl,
              properties: {
                alignment: 'CENTER'
              }
            }
          }
        }
      }
    };
  }

  // ── Text ──
  if (kind === 'text') {
    return {
      createItem: {
        location: { index },
        item: {
          title: sanitizeDisplayText(item.title || 'Description'),
          description: item.description || '',
          textItem: {}
        }
      }
    };
  }

  // ── Question ──
  const normalizedItem = sanitizeFileUploadQuestion(item);
  const required = !!normalizedItem.required;
  const base = {
    createItem: {
      location: { index },
      item: {
        title: sanitizeDisplayText(normalizedItem.title),
        ...(normalizedItem.description ? { description: normalizedItem.description } : {}),
        questionItem: {
          question: {
            required
          }
        }
      }
    }
  };

  if (isQuiz && Array.isArray(item?.correctAnswers) && item.correctAnswers.length) {
    base.createItem.item.questionItem.question.grading = {
      pointValue: typeof item?.points === 'number' ? item.points : 1,
      correctAnswers: {
        answers: item.correctAnswers.map((v) => ({ value: v }))
      }
    };
  }

  switch (String(item.type || '').toLowerCase()) {
    case 'short_text':
    case 'short_answer':
      base.createItem.item.questionItem.question.textQuestion = {};
      break;
    case 'paragraph':
      base.createItem.item.questionItem.question.textQuestion = { paragraph: true };
      break;
    case 'multiple_choice':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'RADIO',
        options: (item.choices ?? []).length
          ? item.choices.map((v) => ({ value: sanitizeDisplayText(v) }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'checkboxes':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'CHECKBOX',
        options: (item.choices ?? []).length
          ? item.choices.map((v) => ({ value: sanitizeDisplayText(v) }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'dropdown':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'DROP_DOWN',
        options: (item.choices ?? []).length
          ? item.choices.map((v) => ({ value: sanitizeDisplayText(v) }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'linear_scale': {
      const scale = item.scale ?? { min: 0, max: 5 };
      base.createItem.item.questionItem.question.scaleQuestion = {
        low: scale.min,
        high: scale.max,
        lowLabel: scale.minLabel ?? '',
        highLabel: scale.maxLabel ?? ''
      };
      break;
    }
    case 'date':
      base.createItem.item.questionItem.question.dateQuestion = { includeTime: false };
      break;
    case 'time':
      base.createItem.item.questionItem.question.timeQuestion = {};
      break;
    default: {
      const err = new Error(`Unsupported question type: ${item.type}`);
      err.statusCode = 400;
      err.code = 'UNSUPPORTED_QUESTION_TYPE';
      throw err;
    }
  }

  return base;
}

/* =========================================================
   Upload an image buffer to the user's Google Drive
========================================================= */
async function uploadImageToDrive({ oauth2, buffer, mimetype, filename }) {
  const drive = google.drive({ version: 'v3', auth: oauth2 });

  const ext = mimetype === 'image/png' ? 'png' : 'jpg';
  const name = filename || `form-image-${Date.now()}.${ext}`;

  const driveFile = await drive.files.create({
    requestBody: { name, mimeType: mimetype || 'image/png' },
    media: { mimeType: mimetype || 'image/png', body: Readable.from(buffer) },
    fields: 'id'
  });

  const fileId = driveFile?.data?.id;
  if (!fileId) {
    const err = new Error('Failed to upload image to Google Drive');
    err.statusCode = 502;
    err.code = 'DRIVE_UPLOAD_FAILED';
    throw err;
  }

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/* =========================================================
   Get Form For User (read)
========================================================= */
export async function getFormForUser({ userId, formId }) {
  const { data: row, error } = await selectFormMetadataForUser({ userId, formId });

  if (error) throw error;
  const oauth2 = await getOAuthClientForUser(userId);
  const forms = google.forms({ version: 'v1', auth: oauth2 });

  if (!row) {
    // Form not in DB (Supabase insert may have failed during creation).
    // Fall back to fetching directly from Google Forms API.
    try {
      const { data: gf } = await forms.forms.get({ formId });
      const editable = mapGoogleFormToEditableModel(gf);
      return {
        metadata: null,
        form: editable,
        editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
        responderUrl: `https://docs.google.com/forms/d/${formId}/viewform`
      };
    } catch {
      const err = new Error('Form not found');
      err.statusCode = 404;
      err.code = 'FORM_NOT_FOUND';
      throw err;
    }
  }

  const { data: gf } = await forms.forms.get({ formId });
  const editable = mapGoogleFormToEditableModel(gf);

  return {
    metadata: row,
    form: editable,
    editUrl: row.edit_url || `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: row.responder_url || `https://docs.google.com/forms/d/${formId}/viewform`
  };
}

/* =========================================================
   Sync (Save) Form — unified items model
   Accepts items[] with kind: question | section | image | text
   Also accepts legacy questions[] for backward compatibility
   Handles image file uploads to Google Drive
========================================================= */
export async function syncFormFromSpecForUser({ userId, formId, spec, formType, imageFiles }) {
  // Verify ownership in DB.
  const { data: row, error } = await supabase
    .from('forms')
    .select('google_form_id')
    .eq('user_id', userId)
    .eq('google_form_id', formId)
    .maybeSingle();

  if (error) throw error;
  if (!row) {
    const err = new Error('Form not found');
    err.statusCode = 404;
    err.code = 'FORM_NOT_FOUND';
    throw err;
  }

  const oauth2 = await getOAuthClientForUser(userId);
  const forms = google.forms({ version: 'v1', auth: oauth2 });

  const { data: existing } = await forms.forms.get({ formId });
  const existingItems = Array.isArray(existing?.items) ? existing.items : [];

  const requests = [];

  // Update title/description.
  requests.push({
    updateFormInfo: {
      info: {
        title: spec.title,
        description: typeof spec.description === 'string' ? spec.description : ''
      },
      updateMask: 'title,description'
    }
  });

  const isQuiz = String(formType || '').toLowerCase().trim() === 'quiz';
  if (isQuiz) {
    requests.push({
      updateSettings: {
        settings: { quizSettings: { isQuiz: true } },
        updateMask: 'quizSettings.isQuiz'
      }
    });
  }

  // Delete existing items from highest index to lowest to avoid index shifting.
  for (let i = existingItems.length - 1; i >= 0; i--) {
    requests.push({ deleteItem: { location: { index: i } } });
  }

  // Build unified items list.
  // If spec.items is provided (new unified model), use it.
  // Otherwise fall back to legacy spec.questions.
  let allItems = [];
  if (Array.isArray(spec.items) && spec.items.length > 0) {
    allItems = spec.items;
  } else {
    const qs = Array.isArray(spec.questions) ? spec.questions : [];
    allItems = qs.map((q) => ({ kind: 'question', ...q }));
  }

  // Upload any pending image files to Google Drive
  const fileMap = imageFiles || {};
  for (let i = 0; i < allItems.length; i++) {
    const it = allItems[i];
    if (it.kind === 'image' && !it.imageUrl) {
      // Check if there's a file for this index
      const fileKey = `image_${i}`;
      const file = fileMap[fileKey];
      if (file && file.buffer) {
        const url = await uploadImageToDrive({
          oauth2,
          buffer: file.buffer,
          mimetype: file.mimetype,
          filename: file.originalname
        });
        allItems[i] = { ...it, imageUrl: url };
      }
    }
  }

  // Create items in order
  let insertIndex = 0;
  for (const it of allItems) {
    const req = toGoogleItemRequest(it, insertIndex, { isQuiz });
    if (req) {
      requests.push(req);
      insertIndex += 1;
    }
  }

  await forms.forms.batchUpdate({
    formId,
    requestBody: { requests }
  });

  // Keep DB title/description in sync.
  await supabase
    .from('forms')
    .update({ title: spec.title, description: spec.description || '' })
    .eq('user_id', userId)
    .eq('google_form_id', formId);

  return {
    formId,
    editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: `https://docs.google.com/forms/d/${formId}/viewform`
  };
}
