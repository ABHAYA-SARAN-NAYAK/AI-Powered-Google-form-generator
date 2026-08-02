import { supabase } from './supabaseClient.js';
import { createGoogleFormFromSpecForUser } from './userGoogleFormsService.js';
import { generateTemplateFormSpec } from './geminiService.js';
import { getTemplateDefinition } from '../utils/formTemplates.js';
import { logger } from '../utils/logger.js';

const VALID_TYPES = new Set([
  'short_text',
  'short_answer',
  'paragraph',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'linear_scale',
  'date',
  'time'
]);

function normalizeQuestionType(type) {
  const raw = String(type || '').trim().toLowerCase();
  if (!VALID_TYPES.has(raw)) return 'short_text';
  if (raw === 'short_answer') return 'short_text';
  return raw;
}

function normalizeQuestion(question, idx) {
  const type = normalizeQuestionType(question?.type);
  const title = String(question?.title || question?.question || '').trim() || `Question ${idx + 1}`;

  const normalized = {
    type,
    title,
    required: question?.required !== undefined ? Boolean(question.required) : true
  };

  if (type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown') {
    const source = Array.isArray(question?.choices)
      ? question.choices
      : Array.isArray(question?.options)
        ? question.options
        : [];

    const uniqueChoices = source
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);

    normalized.choices = uniqueChoices.length ? uniqueChoices : ['Option 1', 'Option 2'];
  }

  if (type === 'linear_scale') {
    const min = Number.isInteger(question?.scale?.min) ? question.scale.min : 0;
    const max = Number.isInteger(question?.scale?.max) ? question.scale.max : 5;
    normalized.scale = {
      min: Math.max(0, Math.min(1, min)),
      max: Math.max(2, Math.min(10, max)),
      minLabel: String(question?.scale?.minLabel || '').trim(),
      maxLabel: String(question?.scale?.maxLabel || '').trim()
    };
  }

  return normalized;
}

function normalizeSpec(rawSpec, fallbackTitle, fallbackDescription) {
  const questions = Array.isArray(rawSpec?.questions) ? rawSpec.questions : [];
  const normalizedQuestions = questions
    .map((q, idx) => normalizeQuestion(q, idx))
    .filter((q, idx, arr) => arr.findIndex((x) => x.title.toLowerCase() === q.title.toLowerCase()) === idx);

  if (!normalizedQuestions.length) {
    const err = new Error('Template generation did not return valid questions');
    err.statusCode = 502;
    err.code = 'TEMPLATE_EMPTY_QUESTIONS';
    throw err;
  }

  return {
    title: String(rawSpec?.title || fallbackTitle || 'Generated Template Form').trim() || 'Generated Template Form',
    description: String(rawSpec?.description || fallbackDescription || '').trim(),
    questions: normalizedQuestions
  };
}

async function insertFormWithTemplateType(payload) {
  return supabase.from('forms').insert(payload).select('*').single();
}

async function persistTemplateMetadata({ userId, createdBy, result, spec, templateType, formType }) {
  const basePayload = {
    google_form_id: result.formId,
    google_form_url: result.responderUrl,
    edit_url: result.editUrl,
    responder_url: result.responderUrl,
    title: spec.title,
    description: spec.description,
    form_type: formType,
    template_type: templateType,
    created_by: createdBy,
    user_id: userId
  };

  try {
    let insertResult = await insertFormWithTemplateType(basePayload);

    if (insertResult.error?.code === '42703' && String(insertResult.error?.message || '').includes('template_type')) {
      const fallbackPayload = { ...basePayload };
      delete fallbackPayload.template_type;
      insertResult = await insertFormWithTemplateType(fallbackPayload);
    }

    if (insertResult.error) {
      logger.warn({ err: insertResult.error }, 'Supabase insert forms failed for template form (continuing)');
      return;
    }

    const formRow = insertResult.data;
    if (!formRow?.id) return;

    const questionRows = spec.questions.map((q, idx) => ({
      form_id: formRow.id,
      question_order: idx,
      ai_question_id: null,
      title: q.title,
      type: q.type,
      required: !!q.required,
      validation: q.validation ?? null,
      created_by: createdBy
    }));

    if (questionRows.length) {
      const { error: qErr } = await supabase.from('form_questions').insert(questionRows);
      if (qErr) {
        logger.warn({ err: qErr }, 'Supabase insert form_questions failed for template form (continuing)');
      }
    }
  } catch (persistErr) {
    logger.warn({ err: persistErr }, 'Supabase persistence failed for template form (continuing)');
  }
}

export async function generateFormFromTemplateForUser({ userId, templateType, customization }) {
  const definition = getTemplateDefinition(templateType);
  if (!definition) {
    const err = new Error('Unsupported template type');
    err.statusCode = 400;
    err.code = 'INVALID_TEMPLATE_TYPE';
    throw err;
  }

  const titleFromCustomization = String(customization?.title || '').trim();
  const customDescription = String(customization?.description || '').trim();

  const aiRaw = await generateTemplateFormSpec({
    templateType,
    templateLabel: definition.label,
    customization
  });

  const spec = normalizeSpec(aiRaw, titleFromCustomization || definition.defaultTitle, customDescription || definition.description);

  if (titleFromCustomization) {
    spec.title = titleFromCustomization;
  }
  if (customDescription) {
    spec.description = customDescription;
  }

  const created = await createGoogleFormFromSpecForUser({
    userId,
    spec,
    formType: definition.formType
  });

  const createdBy = userId ?? 'unknown';
  await persistTemplateMetadata({
    userId,
    createdBy,
    result: created,
    spec,
    templateType,
    formType: definition.formType
  });

  return {
    formId: created.formId,
    editLink: created.editUrl,
    viewLink: created.responderUrl,
    templateType
  };
}
