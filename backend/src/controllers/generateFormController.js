import { google } from 'googleapis';
import { Readable } from 'node:stream';
import { generateFormSpec } from '../services/geminiService.js';
import { createGoogleFormFromSpecForUser } from '../services/userGoogleFormsService.js';
import { getOAuthClientForUser } from '../services/googleOAuthService.js';
import { supabase } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sanitizeFileUploadQuestion, sanitizeAllFileUploads } from '../utils/formHelpers.js';


/**
 * Upload a QR image buffer to the user's Google Drive and return a public URL.
 */
async function uploadQrToDrive({ userId, buffer, mimetype }) {
  const oauth2 = await getOAuthClientForUser(userId);
  const drive = google.drive({ version: 'v3', auth: oauth2 });

  const ext = mimetype === 'image/png' ? 'png' : 'jpg';

  const driveFile = await drive.files.create({
    requestBody: {
      name: `qr-code-${Date.now()}.${ext}`,
      mimeType: mimetype || 'image/png'
    },
    media: {
      mimeType: mimetype || 'image/png',
      body: Readable.from(buffer)
    },
    fields: 'id'
  });

  const fileId = driveFile?.data?.id;
  if (!fileId) {
    const err = new Error('Failed to upload QR image to Google Drive');
    err.statusCode = 502;
    err.code = 'DRIVE_UPLOAD_FAILED';
    throw err;
  }

  // Make publicly viewable
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export const generateFormController = asyncHandler(async (req, res) => {
  const { prompt, formType, audience, language, tone } = req.validatedBody;
  const userId = req.user?.id;

  // If a QR image file was uploaded, push it to Google Drive first
  let qrImageUrl = null;
  if (req.file && req.file.buffer) {
    qrImageUrl = await uploadQrToDrive({
      userId,
      buffer: req.file.buffer,
      mimetype: req.file.mimetype
    });
    logger.info({ qrImageUrl }, 'QR image uploaded to Google Drive');
  }

  const spec = await generateFormSpec({ prompt, formType, audience, language, tone, qrImageUrl });

  const created = await createGoogleFormFromSpecForUser({ userId, spec, formType, qrImageUrl });

  const createdBy = userId ?? 'unknown';

  // Persistence is best-effort; do not block form creation if Supabase is misconfigured.
  try {
    const { data: formRow, error: formErr } = await supabase
      .from('forms')
      .insert({
        google_form_id: created.formId,
        google_form_url: created.responderUrl,
        edit_url: created.editUrl,
        responder_url: created.responderUrl,
        title: spec.title,
        description: spec.description,
        prompt,
        form_type: formType,
        audience,
        language,
        tone,
        created_by: createdBy,
        user_id: userId
      })
      .select('*')
      .single();

    if (formErr) {
      logger.warn({ err: formErr }, 'Supabase insert forms failed (continuing without persistence)');
    } else if (formRow?.id) {
      const questionRows = spec.questions.map((q, idx) => ({
        form_id: formRow.id,
        question_order: idx,
        ai_question_id: q.id,
        title: q.title,
        type: q.type,
        required: !!q.required,
        validation: q.validation ?? null,
        created_by: createdBy
      }));

      if (questionRows.length) {
        const { error: qErr } = await supabase.from('form_questions').insert(questionRows);
        if (qErr) {
          logger.warn({ err: qErr }, 'Supabase insert form_questions failed (continuing)');
        }
      }
    }
  } catch (persistErr) {
    logger.warn({ err: persistErr }, 'Supabase persistence failed (continuing)');
  }

  res.json({
    formId: created.formId,
    formUrl: created.responderUrl,
    editUrl: created.editUrl,
    responderUrl: created.responderUrl,
    title: spec.title,
    description: spec.description,
    questions: spec.questions
  });
});
