/**
 * AI Form Improvement Service
 *
 * Improves an existing Google Form using Gemini AI.
 * Compares original vs improved, then applies changes via Google Forms batchUpdate.
 *
 * Flow:
 *   1. Verify ownership in Supabase
 *   2. Fetch existing form from Google Forms API
 *   3. Call Gemini (professional survey designer prompt)
 *   4. Validate + normalise improved spec
 *   5. Compute diff (added / updated / removed questions)
 *   6. Send batchUpdate: updateFormInfo + deleteItem + createItem
 *   7. Update Supabase metadata (title, description, updated_at)
 *   8. Return { improvedForm, editLink, viewLink, message, summary }
 *
 * Supports dryRun=true: steps 6–7 are skipped so callers can preview
 * the AI result before committing it to Google Forms.
 */

import { google } from 'googleapis';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { supabase } from './supabaseClient.js';
import { getOAuthClientForUser } from './googleOAuthService.js';

// ─── Valid question types ────────────────────────────────────────────────────

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

// ─── Validation / Normalisation ──────────────────────────────────────────────

function normalizeType(type) {
  const raw = String(type || '').trim().toLowerCase();
  if (VALID_TYPES.has(raw)) return raw;
  if (raw === 'short_answer' || raw === 'short' || raw === 'text') return 'short_text';
  if (raw === 'long_answer' || raw === 'long_text') return 'paragraph';
  if (raw === 'multiple choice' || raw === 'mcq') return 'multiple_choice';
  if (raw === 'rating' || raw === 'scale') return 'linear_scale';
  return 'short_text';
}

function normalizeQuestion(q, idx) {
  const title = String(q?.question || q?.title || '').trim() || `Question ${idx + 1}`;
  const type = normalizeType(q?.type);
  const normalized = { title, type, required: Boolean(q?.required) };

  // Multiple-choice / checkboxes / dropdown — need options array
  if (type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown') {
    const raw = Array.isArray(q?.options)
      ? q.options
      : Array.isArray(q?.choices)
        ? q.choices
        : [];

    const choices = raw
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((c) => c.toLowerCase() === v.toLowerCase()) === i);

    normalized.choices = choices.length ? choices : ['Option 1', 'Option 2'];
  }

  // Linear scale — need min/max and optional labels
  if (type === 'linear_scale') {
    normalized.scale = {
      min: Number.isInteger(q?.scale?.min) ? Math.max(0, Math.min(1, q.scale.min)) : 1,
      max: Number.isInteger(q?.scale?.max) ? Math.max(2, Math.min(10, q.scale.max)) : 5,
      minLabel: String(q?.scale?.minLabel || '').trim(),
      maxLabel: String(q?.scale?.maxLabel || '').trim()
    };
  }

  return normalized;
}

/**
 * Validates and normalises a raw form structure object.
 * Throws AppError if no valid questions remain after normalisation.
 */
function validateFormStructure(source) {
  const questions = Array.isArray(source?.questions) ? source.questions : [];

  const normalized = questions
    .map((q, idx) => normalizeQuestion(q, idx))
    // Remove duplicate questions (case-insensitive title match)
    .filter((q, i, arr) => arr.findIndex((x) => x.title.toLowerCase() === q.title.toLowerCase()) === i);

  if (!normalized.length) {
    throw new AppError('Improved form has no valid questions', {
      statusCode: 400,
      code: 'INVALID_IMPROVED_FORM'
    });
  }

  return {
    title: String(source?.title || 'Improved Form').trim() || 'Improved Form',
    description: String(source?.description || '').trim(),
    questions: normalized
  };
}

// ─── Gemini AI ────────────────────────────────────────────────────────────────

function extractGeminiText(data) {
  const candidates = data?.candidates;
  if (Array.isArray(candidates) && candidates.length) {
    return candidates[0]?.content?.parts?.[0]?.text || '';
  }
  return '';
}

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callGeminiImprove({ formStructure, improvementGoal }) {
  const model = 'models/gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const prompt = `You are a professional survey designer.

Improve the following form by:
- making questions clearer
- adding missing important questions
- improving answer options
- ensuring logical question order
- adding rating questions if useful

Additional improvement goal:
${String(improvementGoal || '').trim() || 'Improve question quality and add missing questions'}

Return ONLY JSON. No explanations, no markdown fences.

Form JSON:
${JSON.stringify(formStructure, null, 2)}

Return JSON format:
{
  "title": "",
  "description": "",
  "questions": [
    {
      "type": "short_text",
      "question": ""
    },
    {
      "type": "multiple_choice",
      "question": "",
      "options": []
    }
  ]
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let data;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`Gemini AI failed (HTTP ${response.status}): ${errorText}`, {
        statusCode: 502,
        code: 'GEMINI_API_ERROR'
      });
    }

    data = await response.json();
  } catch (cause) {
    if (cause instanceof AppError) throw cause;

    const code = cause?.cause?.code || cause?.code;
    const syscall = cause?.cause?.syscall || cause?.syscall;
    const causeText = [code && `code=${code}`, syscall && `syscall=${syscall}`]
      .filter(Boolean)
      .join(', ');

    throw new AppError(
      cause?.name === 'AbortError'
        ? 'Gemini request timed out after 30 seconds'
        : `Gemini network request failed${causeText ? ` (${causeText})` : ''}`,
      { statusCode: 502, code: 'GEMINI_FETCH_FAILED', cause }
    );
  } finally {
    clearTimeout(timeout);
  }

  const rawText = extractGeminiText(data).trim();
  const parsed = extractJSON(rawText);

  if (!parsed || typeof parsed !== 'object') {
    throw new AppError('Gemini returned no parseable JSON', {
      statusCode: 502,
      code: 'GEMINI_PARSE_ERROR'
    });
  }

  return parsed;
}

// ─── Google Forms Item Builder ────────────────────────────────────────────────

function sanitize(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCreateItemRequest(question, index) {
  const q = { required: !!question.required };

  switch (question.type) {
    case 'short_text':
      q.textQuestion = {};
      break;
    case 'paragraph':
      q.textQuestion = { paragraph: true };
      break;
    case 'multiple_choice':
      q.choiceQuestion = {
        type: 'RADIO',
        options: (question.choices ?? []).length
          ? question.choices.map((v) => ({ value: sanitize(v) }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'checkboxes':
      q.choiceQuestion = {
        type: 'CHECKBOX',
        options: (question.choices ?? []).length
          ? question.choices.map((v) => ({ value: sanitize(v) }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'dropdown':
      q.choiceQuestion = {
        type: 'DROP_DOWN',
        options: (question.choices ?? []).length
          ? question.choices.map((v) => ({ value: sanitize(v) }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'linear_scale': {
      const scale = question.scale ?? { min: 1, max: 5 };
      q.scaleQuestion = {
        low: scale.min ?? 1,
        high: scale.max ?? 5,
        lowLabel: scale.minLabel || '',
        highLabel: scale.maxLabel || ''
      };
      break;
    }
    case 'date':
      q.dateQuestion = { includeTime: false };
      break;
    case 'time':
      q.timeQuestion = {};
      break;
    default:
      q.textQuestion = {};
  }

  return {
    createItem: {
      item: {
        title: sanitize(question.title),
        questionItem: { question: q }
      },
      location: { index }
    }
  };
}

// ─── Diff Computation ─────────────────────────────────────────────────────────

/**
 * Title similarity: 0 = no match, 1–2 = partial, 3 = exact.
 */
function titleSimilarity(a, b) {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 3;
  if (na.startsWith(nb) || nb.startsWith(na)) return 2;
  const wordsA = new Set(na.split(/\s+/).filter((w) => w.length > 3));
  const overlap = [...wordsA].filter((w) => nb.includes(w)).length;
  return overlap >= 2 ? 1 : 0;
}

/**
 * Greedy match improved questions → existing Google Form items by title.
 * Returns Map<improvedIndex, existingItemIndex> and Set<usedExistingIndex>.
 */
function matchQuestions(existingItems, improvedQuestions) {
  const matched = new Map();
  const usedExisting = new Set();

  for (let ni = 0; ni < improvedQuestions.length; ni++) {
    const newTitle = improvedQuestions[ni].title || '';
    let bestMatch = -1;
    let bestScore = 0;

    for (let ei = 0; ei < existingItems.length; ei++) {
      if (usedExisting.has(ei)) continue;
      const score = titleSimilarity(newTitle, existingItems[ei]?.title || '');
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ei;
      }
    }

    if (bestMatch >= 0 && bestScore > 0) {
      matched.set(ni, bestMatch);
      usedExisting.add(bestMatch);
    }
  }

  return { matched, usedExisting };
}

/**
 * Returns human-readable diff: which questions were added, updated, or removed.
 */
function computeDiff(existingItems, improvedQuestions) {
  const { matched, usedExisting } = matchQuestions(existingItems, improvedQuestions);

  const added = improvedQuestions
    .filter((_, ni) => !matched.has(ni))
    .map((q) => q.title);

  const removed = existingItems
    .filter((_, ei) => !usedExisting.has(ei))
    .map((item) => item?.title || '');

  const updated = improvedQuestions
    .filter((q, ni) => {
      if (!matched.has(ni)) return false;
      const ei = matched.get(ni);
      return (existingItems[ei]?.title || '').toLowerCase() !== q.title.toLowerCase();
    })
    .map((q) => q.title);

  return { added, updated, removed };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Improve a Google Form with Gemini AI.
 *
 * @param {object}  params
 * @param {string}  params.userId
 * @param {string}  params.googleFormId
 * @param {object}  params.currentFormStructure  – current questions/title/description
 * @param {string}  [params.improvementGoal]
 * @param {boolean} [params.dryRun=false]        – if true, skip writing to Google + Supabase
 * @returns {Promise<{improvedForm, editLink, viewLink, message, summary}>}
 */
export async function improveFormWithAI({
  userId,
  googleFormId,
  currentFormStructure,
  improvementGoal,
  dryRun = false
}) {
  if (!googleFormId) {
    throw new AppError('googleFormId is required', { statusCode: 400, code: 'BAD_REQUEST' });
  }

  // 1. Verify ownership in Supabase
  const { data: row, error: dbError } = await supabase
    .from('forms')
    .select('google_form_id, form_type')
    .eq('user_id', userId)
    .eq('google_form_id', googleFormId)
    .maybeSingle();

  if (dbError) throw dbError;
  if (!row) {
    throw new AppError('Form not found', { statusCode: 404, code: 'FORM_NOT_FOUND' });
  }

  // 2. Fetch existing form from Google Forms API (to get itemIds for diff)
  const oauth2 = await getOAuthClientForUser(userId);
  const forms = google.forms({ version: 'v1', auth: oauth2 });

  const { data: existingGoogleForm } = await forms.forms.get({ formId: googleFormId });
  const existingItems = Array.isArray(existingGoogleForm?.items) ? existingGoogleForm.items : [];

  // 3. Validate + normalise input structure
  const normalizedInput = validateFormStructure(currentFormStructure);

  // 4. Call Gemini AI
  const aiResult = await callGeminiImprove({
    formStructure: normalizedInput,
    improvementGoal:
      String(improvementGoal || '').trim() || 'Improve question quality and add missing questions'
  });

  // 5. Validate + normalise improved spec
  const improvedSpec = validateFormStructure(aiResult);

  // 6. Compute diff for summary
  const diff = computeDiff(existingItems, improvedSpec.questions);

  if (!dryRun) {
    // 7. Build batchUpdate requests:
    //    updateFormInfo  → title / description
    //    deleteItem      → remove all existing items (by location index, highest first)
    //    createItem      → recreate all improved questions in order
    const requests = [
      {
        updateFormInfo: {
          info: {
            title: improvedSpec.title,
            description: improvedSpec.description || ''
          },
          updateMask: 'title,description'
        }
      },
      // deleteItem operations — delete from highest index to lowest to avoid shifting
      ...existingItems
        .map((_, idx) => ({ deleteItem: { location: { index: idx } } }))
        .reverse(),
      // createItem operations
      ...improvedSpec.questions.map((q, idx) => buildCreateItemRequest(q, idx))
    ];

    // 8. Send batchUpdate to Google Forms API
    await forms.forms.batchUpdate({
      formId: googleFormId,
      requestBody: { requests }
    });

    // 9. Update Supabase metadata
    await supabase
      .from('forms')
      .update({
        title: improvedSpec.title,
        description: improvedSpec.description || '',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('google_form_id', googleFormId);
  }

  return {
    improvedForm: {
      title: improvedSpec.title,
      description: improvedSpec.description,
      questions: improvedSpec.questions.map((q) => ({
        type: q.type,
        question: q.title,
        options: q.choices || [],
        required: !!q.required,
        ...(q.scale ? { scale: q.scale } : {})
      }))
    },
    editLink: `https://docs.google.com/forms/d/${googleFormId}/edit`,
    viewLink: `https://docs.google.com/forms/d/${googleFormId}/viewform`,
    message: dryRun ? 'AI preview generated (not yet applied)' : 'Form successfully improved',
    summary: {
      questionsAdded: diff.added.length,
      questionsUpdated: diff.updated.length,
      questionsRemoved: diff.removed.length,
      totalQuestions: improvedSpec.questions.length,
      changes: {
        added: diff.added,
        updated: diff.updated,
        removed: diff.removed
      }
    }
  };
}
