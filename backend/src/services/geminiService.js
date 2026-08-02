// Gemini Integration Service
// Supports: Form generation + Image prompt extraction

import { env } from '../config/env.js';
import { sanitizeFileUploadQuestion, sanitizeAllFileUploads } from '../utils/formHelpers.js';

const GEMINI_KEYS = [
  env.GEMINI_API_KEY,
  env.GEMINI_API_KEY_2,
  env.GEMINI_API_KEY_3,
].filter(Boolean);

const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
];

async function requestGemini({ body, failureLabel }) {
  const triedCombinations = [];

  for (const key of GEMINI_KEYS) {
    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          return response.json();
        }

        const errorText = await response.text();
        let errorJson;
        try { errorJson = JSON.parse(errorText); } catch { errorJson = null; }
        const errorCode = errorJson?.error?.code;

        if (errorCode === 429 || errorCode === 404 || errorCode === 403) {
          triedCombinations.push({ key: key.slice(-6), model, code: errorCode });
          continue;
        }

        const err = new Error(`${failureLabel}: ${errorText}`);
        err.statusCode = response.status || 502;
        err.code = 'GEMINI_API_ERROR';
        throw err;

      } catch (cause) {
        clearTimeout(timeout);

        if (cause?.code === 'GEMINI_API_ERROR') throw cause;

        if (cause?.name === 'AbortError') {
          triedCombinations.push({ key: key.slice(-6), model, code: 'TIMEOUT' });
          continue;
        }

        triedCombinations.push({ key: key.slice(-6), model, code: 'NETWORK' });
        continue;
      }
    }
  }

  const err = new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
  err.statusCode = 503;
  err.code = 'GEMINI_ALL_KEYS_EXHAUSTED';
  throw err;
}

/* =========================================================
   Helper: Extract clean text from Gemini response
========================================================= */
function extractText(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(extractText).join('\n');
  if (typeof obj === 'object') {
    for (const key of ['text', 'content', 'parts', 'candidates']) {
      if (obj[key] !== undefined) return extractText(obj[key]);
    }
    return Object.values(obj).map(extractText).join('\n');
  }
  return '';
}

/* =========================================================
   Helper: Safely Extract JSON from Text
========================================================= */
function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

/* =========================================================
   1️⃣ Generate Form Specification
========================================================= */
async function generateFormSpec({ prompt, formType, audience, language, tone, qrImageUrl }) {

  // When a QR image URL is provided, tell Gemini to focus on questions only —
  // the QR image item will be injected at index 0 by the backend directly.
  const qrNote = qrImageUrl
    ? `\nNOTE: A payment QR code image will be added automatically at the top of the form. Do NOT include any image-type items. Focus only on generating the questions.`
    : '';

  const structuredPrompt = `
Generate a structured JSON form specification.

IMPORTANT:
- Return ONLY valid JSON.
- Do NOT include explanations.
- Follow this exact structure:

{
  "title": "",
  "description": "",
  "questions": [
    {
      "title": "",
      "type": "multiple_choice | checkboxes | paragraph | short_text | linear_scale | dropdown | date | time",
      "choices": [],
      "required": true
    }
  ]
}
${qrNote}

FILE UPLOAD RULE:
Do NOT use FILE_UPLOAD or file_upload type for questions (it is not supported via API).
If the user prompt requests a file upload, document upload, image upload, photo upload, resume upload, or attachment as a question, create a short_text question with:
- title: "Paste your image link here (Google Drive / Photos link)"
- description: "Upload your image to Google Drive and paste the shareable link below."

User Prompt:
${prompt}

Form Type: ${formType}
Audience: ${audience}
Language: ${language}
Tone: ${tone}
`;

  const data = await requestGemini({
    failureLabel: 'Gemini request failed',
    body: {
      contents: [{ parts: [{ text: structuredPrompt }] }]
    }
  });
  const rawText = extractText(data).trim();

  const parsed = extractJSON(rawText);

  let spec = {
    title: '',
    description: '',
    questions: []
  };

  if (parsed && typeof parsed === 'object') {
    spec.title = parsed.title || 'Generated Form';
    spec.description = parsed.description || '';
    const rawQs = Array.isArray(parsed.questions) ? parsed.questions : [];
    spec.questions = rawQs.map(sanitizeFileUploadQuestion);
  } else {
    // fallback if Gemini fails JSON formatting
    spec.title = prompt?.split('\n')[0]?.slice(0, 100) || 'Generated Form';
    spec.description = rawText;
    spec.questions = [];
  }

  return spec;
}

/* =========================================================
   1.1 Improve Existing Form Specification
========================================================= */
async function improveFormSpec({ formStructure, improvementGoal }) {

  const safeGoal =
    String(improvementGoal || '').trim() ||
    'Improve question quality and add missing questions';

  const prompt = `
Improve the following form by:
- improving clarity
- adding missing questions
- making questions more professional
- ensuring good survey structure

Additional goal:
${safeGoal}

Return ONLY valid JSON in this exact structure:
{
  "title": "",
  "description": "",
  "questions": [
    {
      "type": "multiple_choice | checkboxes | paragraph | short_text | linear_scale | dropdown | date | time",
      "question": "",
      "options": []
    }
  ]
}

Input form structure JSON:
${JSON.stringify(formStructure || {}, null, 2)}
`;

  const data = await requestGemini({
    failureLabel: 'Gemini improve request failed',
    body: {
      contents: [{ parts: [{ text: prompt }] }]
    }
  });
  const rawText = extractText(data).trim();
  const parsed = extractJSON(rawText);

  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Gemini returned non-JSON improved form structure');
    err.statusCode = 502;
    err.code = 'GEMINI_INVALID_JSON';
    throw err;
  }

  return parsed;
}

/* =========================================================
   1.2 Generate Form From Template
========================================================= */
async function generateTemplateFormSpec({ templateType, templateLabel, customization }) {

  const prompt = `
You are a professional form designer.

Generate a structured JSON for a Google Form template.

Template type: ${templateLabel || templateType}

Requirements:
- Include common, practical questions for this template
- Ensure logical order
- Use proper question types
- Return clean JSON only

Customization:
${JSON.stringify(customization || {}, null, 2)}

JSON format:
{
  "title": "",
  "description": "",
  "questions": [
    {
      "type": "short_answer | paragraph | multiple_choice | checkboxes | dropdown | linear_scale | date | time",
      "question": "",
      "options": []
    }
  ]
}
`;

  const data = await requestGemini({
    failureLabel: 'Gemini template request failed',
    body: {
      contents: [{ parts: [{ text: prompt }] }]
    }
  });
  const rawText = extractText(data).trim();
  const parsed = extractJSON(rawText);

  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Gemini returned non-JSON template form structure');
    err.statusCode = 502;
    err.code = 'GEMINI_INVALID_JSON';
    throw err;
  }

  return parsed;
}

/* =========================================================
   1.3 Generate Form From Document Text
========================================================= */
async function generateFormSpecFromDocument({ documentText }) {

  const prompt = `
You are a professional form designer.

Analyze the following document and generate a Google Form structure.

Identify:
- title
- description
- important questions
- question types (short answer, multiple choice, paragraph, rating)

Return ONLY JSON in this format:

{
  "title": "",
  "description": "",
  "questions": [
    {
      "type": "short_answer",
      "question": ""
    },
    {
      "type": "multiple_choice",
      "question": "",
      "options": []
    }
  ]
}

Document content:
${documentText}
`;

  const data = await requestGemini({
    failureLabel: 'Gemini document generation request failed',
    body: {
      contents: [{ parts: [{ text: prompt }] }]
    }
  });

  const rawText = extractText(data).trim();
  const parsed = extractJSON(rawText);

  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Gemini returned non-JSON document form structure');
    err.statusCode = 502;
    err.code = 'GEMINI_INVALID_JSON';
    throw err;
  }

  return parsed;
}

/* =========================================================
   2️⃣ Extract Prompt From Images (Gemini Vision)
========================================================= */
async function extractPromptFromImages({ files }) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No files provided for image extraction');
  }

  // Validate and prepare inline image data (base64) for Gemini
  const inlineParts = [];
  for (const file of files) {
    // Multer memoryStorage provides `buffer`; older callers might set `base64` already.
    const buf = file?.buffer;
    const base64 = buf ? buf.toString('base64') : file?.base64;

    if (!base64) {
      throw new Error('Uploaded file missing binary data');
    }

    // Basic size/format guard: Gemini may reject very large images.
    const sizeBytes = file?.size || (buf ? buf.length : 0);
    const maxBytes = 6 * 1024 * 1024; // 6 MB (matches multer upload limit)
    if (sizeBytes > maxBytes) {
      throw new Error(`Image too large (${Math.round(sizeBytes / 1024)} KB). Max allowed is ${Math.round(maxBytes / 1024)} KB.`);
    }

    inlineParts.push({
      inlineData: {
        mimeType: file?.mimetype || 'image/jpeg',
        data: base64
      }
    });
  }

  const data = await requestGemini({
    failureLabel: 'Gemini Vision request failed',
    body: {
      contents: [
        {
          parts: [
            { text: 'Extract the main form content or prompt from these images clearly.' },
            ...inlineParts
          ]
        }
      ]
    }
  });
  const extractedPrompt =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return { extractedPrompt };
}

/* =========================================================
   Helper: Compute Form Diff
========================================================= */
export function computeFormDiff(originalItems = [], updatedItems = []) {
  const added = [];
  const removed = [];
  const modified = [];

  const norm = (s) => String(s || '').trim().toLowerCase();

  const origMap = new Map();
  originalItems.forEach((item, idx) => {
    const key = norm(item.title);
    if (key && !origMap.has(key)) {
      origMap.set(key, { item, idx });
    }
  });

  updatedItems.forEach((newItem, newIdx) => {
    const titleKey = norm(newItem.title);
    const origMatch = titleKey ? origMap.get(titleKey) : null;
    const origPosMatch = originalItems[newIdx];

    if (!origMatch && (!origPosMatch || norm(origPosMatch.title) !== titleKey)) {
      const foundInOrig = originalItems.some((o) => norm(o.title) === titleKey);
      if (!foundInOrig) {
        added.push(newItem);
      }
    } else {
      const match = origMatch ? origMatch.item : origPosMatch;
      const changes = [];

      if (match.title && newItem.title && match.title !== newItem.title) {
        changes.push(`title changed to "${newItem.title}"`);
      }
      if (match.type && newItem.type && match.type !== newItem.type) {
        changes.push(`type changed to ${newItem.type}`);
      }
      if (newItem.kind === 'question' && !!match.required !== !!newItem.required) {
        changes.push(newItem.required ? 'now required' : 'now optional');
      }
      if (match.description !== newItem.description && newItem.description !== undefined && (match.description || newItem.description)) {
        changes.push('description updated');
      }
      if (JSON.stringify(match.choices || []) !== JSON.stringify(newItem.choices || []) && ((match.choices && match.choices.length) || (newItem.choices && newItem.choices.length))) {
        changes.push('options updated');
      }

      if (changes.length > 0) {
        modified.push({
          originalTitle: match.title,
          title: newItem.title || match.title,
          changes: changes.join(', ')
        });
      }
    }
  });

  originalItems.forEach((origItem) => {
    const titleKey = norm(origItem.title);
    const foundInUpdated = updatedItems.some((u) => norm(u.title) === titleKey);
    if (!foundInUpdated) {
      removed.push(origItem);
    }
  });

  return { added, removed, modified };
}

/* =========================================================
   1.4 AI Edit Form Specification
========================================================= */
async function aiEditFormSpec({ prompt, currentForm, targetLanguage }) {

  const langStr = String(targetLanguage || 'English').trim();
  const langRule = langStr.toLowerCase() !== 'english'
    ? `\nThe current form language is: ${langStr}
The user's instruction may be in any language (usually English).
Understand the instruction in whatever language it is written.
But ALL output — question titles, descriptions, options, section names — must be written in ${langStr}.
Never mix languages in the output.`
    : '';

  const systemInstruction = `You are a Google Form editor assistant. The user will give you their current form structure as JSON and a plain English instruction. 

Your job is to return a modified version of the form JSON that applies the user's instruction. 

Rules:
- Return ONLY valid JSON. No explanation, no markdown, no backticks.
- Keep all existing items unless the instruction says to remove them
- Maintain the same JSON structure as the input
- If the instruction adds questions, append them at the end unless told otherwise
- If the instruction mentions QR code or payment image, add an imageItem with sourceUri as 'NEEDS_QR_UPLOAD' as a placeholder
- Never use file upload or file_upload type for questions. If the instruction or prompt requests file/image/photo/document upload as a form question, create a short_text question with title "Paste your image link here (Google Drive / Photos link)" and add description "Upload your image to Google Drive and paste the shareable link below."
- If the instruction changes language, translate all titles, descriptions and options to that language
- If the instruction makes questions required, set required: true on all questionItems
- Never remove the form title unless explicitly told to
${langRule}

Return the complete updated form JSON.`;

  const structuredPrompt = `${systemInstruction}

User Instruction:
${prompt}

Current Form Structure JSON:
${JSON.stringify(currentForm || {}, null, 2)}`;

  const data = await requestGemini({
    failureLabel: 'Gemini AI Edit request failed',
    body: {
      contents: [{ parts: [{ text: structuredPrompt }] }]
    }
  });

  const rawText = extractText(data).trim();
  const parsed = extractJSON(rawText);

  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('AI could not process this instruction, try rephrasing');
    err.statusCode = 400;
    err.code = 'AI_EDIT_FAILED';
    throw err;
  }

  const title = parsed.title || currentForm?.title || 'Form';
  const description = parsed.description !== undefined ? parsed.description : (currentForm?.description || '');
  const rawItems = Array.isArray(parsed.items)
    ? parsed.items
    : (Array.isArray(parsed.questions) ? parsed.questions : []);

  const items = rawItems.map((item) => {
    if (
      item.kind === 'image' ||
      item.imageItem ||
      item.type === 'image' ||
      item.sourceUri === 'NEEDS_QR_UPLOAD' ||
      item.imageUrl === 'NEEDS_QR_UPLOAD'
    ) {
      const sourceUri = item.imageUrl || item.sourceUri || item.imageItem?.image?.sourceUri || 'NEEDS_QR_UPLOAD';
      return {
        kind: 'image',
        title: item.title || 'Scan QR Code to Pay',
        imageUrl: sourceUri,
        _isQr: sourceUri === 'NEEDS_QR_UPLOAD' || (item.title && String(item.title).toLowerCase().includes('qr'))
      };
    }

    if (item.kind === 'section' || item.pageBreakItem || item.type === 'section') {
      return {
        kind: 'section',
        title: item.title || 'Untitled Section',
        description: item.description || ''
      };
    }

    if (item.kind === 'text' || item.textItem || item.type === 'text') {
      return {
        kind: 'text',
        title: item.title || '',
        description: item.description || ''
      };
    }

    const baseType = item.type || (item.questionItem?.question?.textQuestion?.paragraph ? 'paragraph' : 'short_text');
    const qObj = {
      kind: 'question',
      title: item.title || item.question || 'Question',
      description: item.description || '',
      type: baseType,
      required: !!(item.required !== undefined ? item.required : item.questionItem?.question?.required),
      choices: Array.isArray(item.choices) ? item.choices : (Array.isArray(item.options) ? item.options : [])
    };
    return sanitizeFileUploadQuestion(qObj);
  });

  const sanitizedItems = sanitizeAllFileUploads(items);

  const updatedForm = {
    title,
    description,
    items: sanitizedItems
  };

  const originalItems = Array.isArray(currentForm?.items)
    ? currentForm.items
    : (Array.isArray(currentForm?.questions)
      ? currentForm.questions.map((q) => ({ kind: 'question', ...q }))
      : []);

  const diff = computeFormDiff(originalItems, items);

  return {
    updatedForm,
    diff
  };
}

/* =========================================================
   1.5 Detect Form Language
========================================================= */
async function detectLanguage({ texts }) {

  const cleanTexts = (Array.isArray(texts) ? texts : [texts])
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 5)
    .join(' | ');

  if (!cleanTexts) {
    return { language: 'English' };
  }

  const prompt = `Detect the language of these texts and return ONLY the language name in English. Example: Hindi, Tamil, French, Arabic. Texts: ${cleanTexts}`;

  try {
    const data = await requestGemini({
      failureLabel: 'Gemini language detection failed',
      body: { contents: [{ parts: [{ text: prompt }] }] }
    });
    const raw = extractText(data).trim();
    const language = raw.split('\n')[0].replace(/[^a-zA-Z\s]/g, '').trim() || 'English';
    return { language };
  } catch {
    return { language: 'English' };
  }
}

/* =========================================================
   1.6 Translate Array of Texts
========================================================= */
async function translateTexts({ texts, targetLanguage }) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return { translated: [] };
  }

  const cleanTarget = String(targetLanguage || 'English').trim();
  if (cleanTarget.toLowerCase() === 'english') {
    return { translated: texts };
  }



  const prompt = `Translate the following JSON array of strings to ${cleanTarget}.
Return ONLY a valid JSON array of translated strings in the same order.
No explanation, no markdown backticks, nothing else.
Input: ${JSON.stringify(texts)}`;

  try {
    const data = await requestGemini({
      failureLabel: 'Gemini translation failed',
      body: { contents: [{ parts: [{ text: prompt }] }] }
    });
    const rawText = extractText(data).trim();
    const parsed = extractJSON(rawText);

    if (Array.isArray(parsed) && parsed.length === texts.length) {
      return {
        translated: parsed.map((t, idx) =>
          typeof t === 'string' && t.trim() ? t.trim() : texts[idx]
        )
      };
    }

    return { translated: texts };
  } catch {
    return { translated: texts };
  }
}

/* =========================================================
   1.7 AI Form Optimization Engine
========================================================= */
async function optimizeFormSpec({ items = [], targetAudience = 'general public', language = 'English' }) {

  const prompt = `You are a form UX expert. Analyze these form items and optimize them.

Form items: ${JSON.stringify(items || [])}
Target audience: ${targetAudience || 'general public'}
Language: ${language || 'English'}

Analyze for:
1. Clarity - are questions clear and unambiguous?
2. Cognitive load - complexity and number of questions
3. Question flow - logical progression
4. Audience suitability - appropriate for target audience
5. Completion likelihood - will users finish this form?

Return ONLY valid JSON, no markdown:
{
  "overall_score": 85,
  "issues": [
    {
      "type": "clarity|cognitive_load|flow|audience|completion",
      "question_index": 0,
      "description": "<what the issue is>",
      "severity": "high|medium|low",
      "suggestion": "<how to fix it>"
    }
  ],
  "optimized_items": [],
  "summary": "<2-3 sentences on what was improved>"
}`;

  const data = await requestGemini({
    failureLabel: 'Gemini Form Optimization failed',
    body: {
      contents: [{ parts: [{ text: prompt }] }]
    }
  });

  const rawText = extractText(data).trim();
  const parsed = extractJSON(rawText);

  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Gemini returned invalid optimization JSON');
    err.statusCode = 502;
    err.code = 'OPTIMIZATION_FAILED';
    throw err;
  }

  const rawOptimized = Array.isArray(parsed.optimized_items) ? parsed.optimized_items : items;
  const sanitizedOptimizedItems = sanitizeAllFileUploads(rawOptimized);

  const diff = computeFormDiff(items, sanitizedOptimizedItems);

  const overallScore = typeof parsed.overall_score === 'number'
    ? Math.max(0, Math.min(100, Math.round(parsed.overall_score)))
    : 80;

  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
  const issues = rawIssues.map((issue) => ({
    type: issue?.type || 'clarity',
    question_index: typeof issue?.question_index === 'number' ? issue.question_index : -1,
    description: issue?.description || 'Optimization suggestion',
    severity: ['high', 'medium', 'low'].includes(String(issue?.severity).toLowerCase())
      ? String(issue.severity).toLowerCase()
      : 'medium',
    suggestion: issue?.suggestion || ''
  }));

  const summary = String(parsed.summary || 'Form structure and clarity have been optimized for better completion rates.').trim();

  return {
    overall_score: overallScore,
    issues,
    optimized_items: sanitizedOptimizedItems,
    summary,
    diff
  };
}

export {
  generateFormSpec,
  improveFormSpec,
  generateTemplateFormSpec,
  generateFormSpecFromDocument,
  extractPromptFromImages,
  aiEditFormSpec,
  detectLanguage,
  translateTexts,
  optimizeFormSpec
};