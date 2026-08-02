import path from 'node:path';
import { AppError } from '../utils/appError.js';
import { supabase } from './supabaseClient.js';
import { logger } from '../utils/logger.js';
import { generateFormSpecFromDocument } from './geminiService.js';
import { createGoogleFormFromSpecForUser } from './userGoogleFormsService.js';

const MAX_DOCUMENT_CHARS = 16_000;

function inferExt(file) {
  const fromName = path.extname(String(file?.originalname || '')).toLowerCase();
  if (fromName) return fromName;

  const mime = String(file?.mimetype || '').toLowerCase();
  if (mime.includes('pdf')) return '.pdf';
  if (mime.includes('wordprocessingml')) return '.docx';
  if (mime.includes('msword')) return '.doc';
  if (mime.includes('text/plain')) return '.txt';

  return '';
}

function cleanExtractedText(text) {
  return String(text || '')
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function enforceTextLimits(text) {
  const cleaned = cleanExtractedText(text);
  if (!cleaned) {
    throw new AppError('Could not extract readable text from document', {
      statusCode: 400,
      code: 'EMPTY_DOCUMENT_TEXT'
    });
  }

  if (cleaned.length <= MAX_DOCUMENT_CHARS) return cleaned;

  return `${cleaned.slice(0, MAX_DOCUMENT_CHARS)}\n\n[Truncated due to size limit]`;
}

async function extractPdfText(buffer) {
  try {
    const mod = await import('pdf-parse');
    const pdfParse = mod.default || mod;
    const result = await pdfParse(buffer);
    return result?.text || '';
  } catch (cause) {
    throw new AppError('Failed to parse PDF file', {
      statusCode: 400,
      code: 'PDF_PARSE_FAILED',
      cause
    });
  }
}

async function extractDocxText(buffer) {
  try {
    const mod = await import('mammoth');
    const mammoth = mod.default || mod;
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || '';
  } catch (cause) {
    throw new AppError('Failed to parse DOCX file', {
      statusCode: 400,
      code: 'DOCX_PARSE_FAILED',
      cause
    });
  }
}

function extractDocTextBestEffort(buffer) {
  // Legacy .doc binary format does not have a reliable parser in this stack.
  // Best effort: decode printable characters to salvage plain text content.
  const text = buffer
    .toString('latin1')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text || text.length < 20) {
    throw new AppError('Unsupported DOC format. Please upload DOCX, PDF, or TXT.', {
      statusCode: 400,
      code: 'UNSUPPORTED_DOC_FORMAT'
    });
  }

  return text;
}

async function extractTextFromFile(file) {
  if (!file?.buffer) {
    throw new AppError('Uploaded file is missing data', {
      statusCode: 400,
      code: 'INVALID_FILE'
    });
  }

  const ext = inferExt(file);

  if (ext === '.pdf') {
    return { sourceType: 'pdf', text: await extractPdfText(file.buffer) };
  }

  if (ext === '.txt') {
    return { sourceType: 'text', text: file.buffer.toString('utf8') };
  }

  if (ext === '.docx') {
    return { sourceType: 'text', text: await extractDocxText(file.buffer) };
  }

  if (ext === '.doc') {
    return { sourceType: 'text', text: extractDocTextBestEffort(file.buffer) };
  }

  throw new AppError('Unsupported file type. Allowed: PDF, DOC, DOCX, TXT', {
    statusCode: 400,
    code: 'UNSUPPORTED_FILE_TYPE'
  });
}

const VALID_TYPES = new Set([
  'short_text',
  'paragraph',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'linear_scale',
  'date',
  'time'
]);

function normalizeType(type) {
  const raw = String(type || '').trim().toLowerCase();
  if (VALID_TYPES.has(raw)) return raw;
  if (raw === 'short_answer' || raw === 'short answer' || raw === 'text') return 'short_text';
  if (raw === 'long_answer' || raw === 'long text') return 'paragraph';
  if (raw === 'multiple choice' || raw === 'mcq') return 'multiple_choice';
  if (raw === 'rating') return 'linear_scale';
  return 'short_text';
}

function normalizeSpec(rawSpec) {
  const title = String(rawSpec?.title || 'Generated Form').trim() || 'Generated Form';
  const description = String(rawSpec?.description || '').trim();

  const questions = (Array.isArray(rawSpec?.questions) ? rawSpec.questions : [])
    .map((q, idx) => {
      const type = normalizeType(q?.type);
      const qTitle = String(q?.title || q?.question || '').trim() || `Question ${idx + 1}`;

      const base = {
        title: qTitle,
        type,
        required: Boolean(q?.required)
      };

      if (type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown') {
        const rawChoices = Array.isArray(q?.choices)
          ? q.choices
          : Array.isArray(q?.options)
            ? q.options
            : [];

        const choices = rawChoices
          .map((v) => String(v || '').trim())
          .filter(Boolean)
          .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);

        base.choices = choices.length ? choices : ['Option 1', 'Option 2'];
      }

      if (type === 'linear_scale') {
        base.scale = {
          min: 1,
          max: 5,
          minLabel: String(q?.scale?.minLabel || '').trim(),
          maxLabel: String(q?.scale?.maxLabel || '').trim()
        };
      }

      return base;
    })
    .filter((q, idx, arr) => arr.findIndex((x) => x.title.toLowerCase() === q.title.toLowerCase()) === idx);

  if (!questions.length) {
    throw new AppError('Gemini did not return valid questions', {
      statusCode: 502,
      code: 'INVALID_AI_FORM_SPEC'
    });
  }

  return { title, description, questions };
}

async function persistGeneratedForm({ userId, created, spec, sourceType, sourceText }) {
  const createdBy = userId ?? 'unknown';

  try {
    const baseInsert = {
      google_form_id: created.formId,
      google_form_url: created.responderUrl,
      edit_url: created.editUrl,
      responder_url: created.responderUrl,
      title: spec.title,
      description: spec.description,
      prompt: sourceText,
      form_type: 'survey',
      audience: 'students',
      language: 'english',
      tone: 'formal',
      created_by: createdBy,
      user_id: userId,
      source_type: sourceType
    };

    let formRow;
    let formErr;

    ({ data: formRow, error: formErr } = await supabase
      .from('forms')
      .insert(baseInsert)
      .select('*')
      .single());

    // Backward compatibility if source_type column is not yet migrated.
    if (formErr && formErr.code === '42703' && String(formErr.message || '').includes('source_type')) {
      ({ data: formRow, error: formErr } = await supabase
        .from('forms')
        .insert({ ...baseInsert, source_type: undefined })
        .select('*')
        .single());
    }

    if (formErr) {
      logger.warn({ err: formErr }, 'Supabase insert forms failed (document flow continuing)');
      return;
    }

    if (!formRow?.id) return;

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

    if (!questionRows.length) return;

    const { error: qErr } = await supabase.from('form_questions').insert(questionRows);
    if (qErr) {
      logger.warn({ err: qErr }, 'Supabase insert form_questions failed (document flow continuing)');
    }
  } catch (cause) {
    logger.warn({ err: cause }, 'Supabase persistence failed for document flow (continuing)');
  }
}

export async function generateGoogleFormFromDocument({ userId, file, text }) {
  const hasFile = !!file;
  const hasText = typeof text === 'string' && text.trim().length > 0;

  if (!hasFile && !hasText) {
    throw new AppError('Provide either a file or text content', {
      statusCode: 400,
      code: 'MISSING_INPUT'
    });
  }

  let sourceType = 'text';
  let rawText = '';

  if (hasFile) {
    const extracted = await extractTextFromFile(file);
    sourceType = extracted.sourceType;
    rawText = extracted.text;
  } else {
    sourceType = 'text';
    rawText = text;
  }

  const cleanedText = enforceTextLimits(rawText);

  const aiRawSpec = await generateFormSpecFromDocument({ documentText: cleanedText });
  const spec = normalizeSpec(aiRawSpec);

  const created = await createGoogleFormFromSpecForUser({
    userId,
    spec,
    formType: 'survey'
  });

  await persistGeneratedForm({
    userId,
    created,
    spec,
    sourceType,
    sourceText: cleanedText
  });

  return {
    formId: created.formId,
    editLink: created.editUrl,
    viewLink: created.responderUrl,
    generatedFrom: sourceType,
    title: spec.title,
    description: spec.description
  };
}
