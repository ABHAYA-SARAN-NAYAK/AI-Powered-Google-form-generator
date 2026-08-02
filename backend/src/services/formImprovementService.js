import { improveFormSpec } from './geminiService.js';
import { syncFormFromSpecForUser } from './userFormsService.js';

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

  if (raw === 'mcq' || raw === 'multiple choice') return 'multiple_choice';
  if (raw === 'short' || raw === 'short answer' || raw === 'text') return 'short_text';
  if (raw === 'long_text' || raw === 'long answer') return 'paragraph';

  return 'short_text';
}

function normalizeQuestion(question, idx) {
  const qTitle = String(question?.title || question?.question || '').trim();
  const title = qTitle || `Question ${idx + 1}`;
  const type = normalizeType(question?.type);

  const normalized = {
    title,
    type,
    required: Boolean(question?.required)
  };

  if (type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown') {
    const rawChoices = Array.isArray(question?.choices)
      ? question.choices
      : Array.isArray(question?.options)
        ? question.options
        : [];

    const choices = rawChoices
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((c) => c.toLowerCase() === v.toLowerCase()) === i);

    normalized.choices = choices.length ? choices : ['Option 1', 'Option 2'];
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

function normalizeFormStructure(formStructure) {
  const source = formStructure || {};
  const questions = Array.isArray(source?.questions) ? source.questions : [];

  const normalizedQuestions = questions
    .map((q, idx) => normalizeQuestion(q, idx))
    .filter((q, idx, arr) => arr.findIndex((x) => x.title.toLowerCase() === q.title.toLowerCase()) === idx);

  if (!normalizedQuestions.length) {
    const err = new Error('Improved form has no valid questions');
    err.statusCode = 400;
    err.code = 'INVALID_IMPROVED_FORM';
    throw err;
  }

  return {
    title: String(source?.title || 'Improved Form').trim() || 'Improved Form',
    description: String(source?.description || '').trim(),
    questions: normalizedQuestions
  };
}

function toClientShape(spec) {
  return {
    title: spec.title,
    description: spec.description,
    questions: spec.questions.map((q) => ({
      type: q.type,
      question: q.title,
      options: q.choices || [],
      required: !!q.required
    }))
  };
}

export async function improveAndSyncFormForUser({ userId, googleFormId, formStructure, improvementGoal, formType }) {
  if (!googleFormId) {
    const err = new Error('googleFormId is required to improve and update a Google Form');
    err.statusCode = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  const normalizedInput = normalizeFormStructure(formStructure);

  const aiResult = await improveFormSpec({
    formStructure: normalizedInput,
    improvementGoal
  });

  const improvedSpec = normalizeFormStructure(aiResult);

  const syncResult = await syncFormFromSpecForUser({
    userId,
    formId: googleFormId,
    spec: improvedSpec,
    formType
  });

  return {
    improvedFormStructure: toClientShape(improvedSpec),
    googleFormId: syncResult.formId,
    editUrl: syncResult.editUrl,
    responderUrl: syncResult.responderUrl
  };
}
