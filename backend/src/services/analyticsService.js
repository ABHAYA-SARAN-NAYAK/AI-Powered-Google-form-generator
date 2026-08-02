/**
 * Analytics Service
 *
 * Fetches Google Form responses, aggregates them by question type, generates
 * AI insights via Gemini, and caches results in Supabase.
 *
 * Flow:
 *   1. Verify form ownership in Supabase
 *   2. Read from cache (unless noCache=true)
 *   3. Fetch form structure + responses from Google Forms API
 *   4. Aggregate per question type
 *   5. Generate AI insights via Gemini (unless noAI=true)
 *   6. Write result to cache
 *   7. Return { analytics, aiInsights, totalResponses }
 *
 * Supported question types:
 *   multiple_choice, dropdown → Pie chart distribution
 *   checkboxes               → Bar chart distribution (multi-select)
 *   linear_scale             → Average score + score distribution
 *   short_text, paragraph    → Text response list
 *   date, time               → Text list
 */

import { google } from 'googleapis';
import { supabase } from './supabaseClient.js';
import { getOAuthClientForUser } from './googleOAuthService.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';

// ─── Cache config ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RESPONSES_PER_PAGE = 5000;
const MAX_TOTAL_RESPONSES = 10_000;
const MAX_TEXT_RESPONSES = 100; // cap stored per question

// ─── Ownership check ──────────────────────────────────────────────────────────

async function verifyOwnership(userId, formId) {
  const { data, error } = await supabase
    .from('forms')
    .select('google_form_id')
    .eq('user_id', userId)
    .eq('google_form_id', formId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new AppError('Form not found', { statusCode: 404, code: 'FORM_NOT_FOUND' });
  }
}

// ─── Supabase cache ───────────────────────────────────────────────────────────

async function readCache(formId) {
  try {
    const { data } = await supabase
      .from('form_analytics')
      .select('analytics_json, updated_at')
      .eq('form_id', formId)
      .maybeSingle();

    if (!data?.analytics_json) return null;

    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > CACHE_TTL_MS) return null;

    return { ...data.analytics_json, fromCache: true, cachedAt: data.updated_at };
  } catch {
    // Table may not exist yet — graceful fallback
    return null;
  }
}

async function writeCache(formId, payload) {
  try {
    await supabase.from('form_analytics').upsert(
      { form_id: formId, analytics_json: payload, updated_at: new Date().toISOString() },
      { onConflict: 'form_id' }
    );
  } catch {
    // Non-fatal — ignore cache write errors (table may not be created yet)
  }
}

// ─── Google Forms response parsing ───────────────────────────────────────────

/**
 * Extract string values from a single Answer object.
 * Google Forms API v1 uses textAnswers for almost everything;
 * choiceAnswers are used for some multi-select question types.
 */
function extractAnswerValues(answer) {
  if (!answer) return [];

  if (Array.isArray(answer.textAnswers?.answers)) {
    return answer.textAnswers.answers
      .map((a) => String(a?.value ?? '').trim())
      .filter(Boolean);
  }

  if (Array.isArray(answer.choiceAnswers?.answers)) {
    return answer.choiceAnswers.answers
      .map((a) => String(a?.value ?? '').trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Build a map: questionId → { title, type, scaleMin, scaleMax }
 * from the Google Forms `items` array.
 */
function buildQuestionMap(formData) {
  const map = {};
  const items = Array.isArray(formData?.items) ? formData.items : [];

  for (const item of items) {
    const qi = item?.questionItem;
    const q = qi?.question;
    if (!q?.questionId) continue;

    let type = 'short_text';
    let scaleMin = 1;
    let scaleMax = 5;

    if (q.textQuestion) {
      type = q.textQuestion.paragraph ? 'paragraph' : 'short_text';
    } else if (q.choiceQuestion) {
      const ct = q.choiceQuestion.type;
      if (ct === 'RADIO') type = 'multiple_choice';
      else if (ct === 'CHECKBOX') type = 'checkboxes';
      else if (ct === 'DROP_DOWN') type = 'dropdown';
    } else if (q.scaleQuestion) {
      type = 'linear_scale';
      scaleMin = q.scaleQuestion.low ?? 1;
      scaleMax = q.scaleQuestion.high ?? 5;
    } else if (q.dateQuestion) {
      type = 'date';
    } else if (q.timeQuestion) {
      type = 'time';
    }

    map[q.questionId] = {
      title: String(item.title || '').trim() || `Question`,
      type,
      scaleMin,
      scaleMax
    };
  }

  return map;
}

/**
 * Aggregate all response objects into per-question analytics.
 */
function aggregateResponses(responses, questionMap) {
  // Initialise accumulators in form-item order (preserve order of questions)
  const accumulators = {};

  for (const [qId, meta] of Object.entries(questionMap)) {
    const isChoice =
      meta.type === 'multiple_choice' ||
      meta.type === 'checkboxes' ||
      meta.type === 'dropdown';
    const isScale = meta.type === 'linear_scale';
    const isText =
      meta.type === 'short_text' ||
      meta.type === 'paragraph' ||
      meta.type === 'date' ||
      meta.type === 'time';

    accumulators[qId] = {
      questionId: qId,
      question: meta.title,
      type: meta.type,
      responseCount: 0,
      ...(isChoice ? { distribution: {} } : {}),
      ...(isScale
        ? { scaleMin: meta.scaleMin, scaleMax: meta.scaleMax, _totalScore: 0, scores: {} }
        : {}),
      ...(isText ? { textResponses: [] } : {})
    };
  }

  for (const response of responses) {
    const answers = typeof response?.answers === 'object' ? response.answers : {};

    for (const [qId, answer] of Object.entries(answers)) {
      const acc = accumulators[qId];
      if (!acc) continue;

      const values = extractAnswerValues(answer);
      if (!values.length) continue;

      acc.responseCount += 1;

      if (acc.distribution !== undefined) {
        for (const v of values) {
          acc.distribution[v] = (acc.distribution[v] || 0) + 1;
        }
      } else if (acc._totalScore !== undefined) {
        const num = parseFloat(values[0]);
        if (!isNaN(num)) {
          acc._totalScore += num;
          const key = String(Math.round(num));
          acc.scores[key] = (acc.scores[key] || 0) + 1;
        }
      } else if (acc.textResponses !== undefined) {
        if (acc.textResponses.length < MAX_TEXT_RESPONSES) {
          for (const v of values) {
            if (acc.textResponses.length < MAX_TEXT_RESPONSES) {
              acc.textResponses.push(v);
            }
          }
        }
      }
    }
  }

  // Finalise — compute averageScore, remove internal _totalScore
  return Object.values(accumulators).map((acc) => {
    if (acc._totalScore !== undefined) {
      const { _totalScore, ...rest } = acc;
      return {
        ...rest,
        averageScore:
          acc.responseCount > 0
            ? Math.round((_totalScore / acc.responseCount) * 100) / 100
            : null
      };
    }
    return acc;
  });
}

// ─── Pagination helper ────────────────────────────────────────────────────────

async function fetchAllResponses(formsClient, formId) {
  const allResponses = [];
  let pageToken;

  do {
    const params = { formId, pageSize: MAX_RESPONSES_PER_PAGE };
    if (pageToken) params.pageToken = pageToken;

    const { data } = await formsClient.forms.responses.list(params);
    const page = Array.isArray(data?.responses) ? data.responses : [];
    allResponses.push(...page);

    pageToken = data?.nextPageToken || null;
  } while (pageToken && allResponses.length < MAX_TOTAL_RESPONSES);

  return allResponses;
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

async function generateAIInsights(analyticsData) {
  if (!env.GEMINI_API_KEY) return null;

  const model = 'models/gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  // Condense data: cap text samples, format numbers
  const condensed = {
    totalResponses: analyticsData.totalResponses,
    questions: analyticsData.questions.map((q) => {
      const base = { question: q.question, type: q.type, responseCount: q.responseCount };
      if (q.distribution) return { ...base, distribution: q.distribution };
      if (q.averageScore !== undefined)
        return { ...base, averageScore: q.averageScore, scaleMin: q.scaleMin, scaleMax: q.scaleMax, scores: q.scores };
      if (q.textResponses)
        return { ...base, textSample: (q.textResponses || []).slice(0, 20) };
      return base;
    })
  };

  const prompt = `You are a data analyst.

Analyze the following survey results and summarize key insights in 3-4 sentences.

Focus on:
- trends and patterns
- majority opinions
- notable scores or ratings
- any negative feedback patterns

Data:
${JSON.stringify(condensed, null, 2)}

Return ONLY a JSON object:
{"insights": "your summary here"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    const parsed = JSON.parse(text.slice(start, end + 1));
    return typeof parsed?.insights === 'string' && parsed.insights.trim() ? parsed.insights.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Fetch and aggregate analytics for a Google Form the user owns.
 *
 * @param {object}  params
 * @param {string}  params.userId
 * @param {string}  params.formId      - Google Form ID
 * @param {boolean} [params.noCache]   - bypass Supabase cache
 * @param {boolean} [params.noAI]      - skip Gemini AI insights
 * @returns {Promise<{analytics, aiInsights, totalResponses, fromCache, cachedAt}>}
 */
export async function getFormAnalyticsForUser({ userId, formId, noCache = false, noAI = false }) {
  // 1. Verify ownership
  await verifyOwnership(userId, formId);

  // 2. Cache read
  if (!noCache) {
    const cached = await readCache(formId);
    if (cached) return cached;
  }

  // 3. Fetch form structure + responses from Google
  const oauth2 = await getOAuthClientForUser(userId);
  const formsClient = google.forms({ version: 'v1', auth: oauth2 });

  let formData, responses;
  try {
    const [formResult, responsesResult] = await Promise.allSettled([
      formsClient.forms.get({ formId }),
      fetchAllResponses(formsClient, formId)
    ]);

    if (formResult.status === 'rejected') {
      const cause = formResult.reason;
      const status = cause?.response?.status ?? cause?.code ?? 502;
      if (status === 401 || status === 403) {
        throw new AppError(
          'Access denied to Google Forms. Re-login to grant the required "View form responses" permission.',
          { statusCode: 403, code: 'GOOGLE_PERMISSION_DENIED', cause }
        );
      }
      throw cause;
    }

    formData = formResult.value?.data;
    responses = responsesResult.status === 'fulfilled' ? responsesResult.value : [];
  } catch (err) {
    if (err instanceof AppError) throw err;
    const status = err?.response?.status ?? err?.code ?? 502;
    if (status === 401 || status === 403) {
      throw new AppError(
        'Access denied to Google Forms. Re-login to grant the required "View form responses" permission.',
        { statusCode: 403, code: 'GOOGLE_PERMISSION_DENIED', cause: err }
      );
    }
    throw err;
  }

  // 4. Build question map + aggregate
  const questionMap = buildQuestionMap(formData);
  const questions = aggregateResponses(responses, questionMap);
  const totalResponses = responses.length;

  // 5. Summary metrics
  const lastResponseAt =
    responses.length > 0
      ? responses.reduce((latest, r) => {
          const t = r?.lastSubmittedTime || r?.createTime;
          if (!t) return latest;
          return !latest || new Date(t) > new Date(latest) ? t : latest;
        }, null)
      : null;

  const questionsAnswered = questions.filter((q) => q.responseCount > 0).length;
  const completionRate =
    questions.length > 0 && totalResponses > 0
      ? Math.round((questionsAnswered / questions.length) * 100)
      : null;

  const ratingQuestions = questions.filter(
    (q) => q.type === 'linear_scale' && q.averageScore !== null
  );
  const averageRating =
    ratingQuestions.length > 0
      ? Math.round(
          (ratingQuestions.reduce((s, q) => s + q.averageScore, 0) / ratingQuestions.length) * 100
        ) / 100
      : null;

  const formTitle = String(formData?.info?.title || '').trim();

  const analyticsData = {
    formTitle,
    totalResponses,
    lastResponseAt,
    completionRate,
    averageRating,
    questions
  };

  // 6. AI insights (non-fatal)
  let aiInsights = null;
  if (!noAI && totalResponses > 0) {
    aiInsights = await generateAIInsights(analyticsData);
  }

  const result = {
    analytics: analyticsData,
    aiInsights,
    totalResponses,
    fromCache: false,
    cachedAt: null
  };

  // 7. Write cache
  await writeCache(formId, result);

  return result;
}
