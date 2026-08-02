import { Router } from 'express';
import { z } from 'zod';
import { requireUser } from '../middlewares/requireUser.js';
import { supabase } from '../services/supabaseClient.js';
import { getFormForUser, syncFormFromSpecForUser } from '../services/userFormsService.js';
import { validateBody } from '../middlewares/validate.js';
import { improveForm } from '../controllers/formsController.js';
import { generateFormTemplateController } from '../controllers/formTemplateController.js';
import { getFormAnalytics } from '../controllers/analyticsController.js';
import { analyticsLimiter } from '../middlewares/rateLimit.js';
import { aiEditFormSpec, detectLanguage, translateTexts, optimizeFormSpec } from '../services/geminiService.js';
import { sanitizeFileUploadQuestion, sanitizeAllFileUploads } from '../utils/formHelpers.js';

import multer from 'multer';


async function selectFormsForUser(userId) {
  const base = 'google_form_id, google_form_url, edit_url, responder_url, title, description, prompt, form_type, audience, language, tone, created_at';

  const withArchived = await supabase
    .from('forms')
    .select(`${base}, archived`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!withArchived.error) return withArchived;

  if (withArchived.error?.code === '42703' && String(withArchived.error?.message || '').includes('archived')) {
    const withoutArchived = await supabase
      .from('forms')
      .select(base)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!withoutArchived.error) {
      return {
        ...withoutArchived,
        data: (withoutArchived.data || []).map((row) => ({ ...row, archived: false }))
      };
    }

    return withoutArchived;
  }

  return withArchived;
}

const router = Router();

router.get('/forms', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data, error } = await selectFormsForUser(userId);

    if (error) throw error;

    res.json({ forms: data || [] });
  } catch (e) {
    next(e);
  }
});

router.delete('/forms/:formId', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const formId = String(req.params.formId || '').trim();
    if (!formId) return res.status(400).json({ error: { message: 'Missing formId', code: 'BAD_REQUEST' } });

    const { data, error } = await supabase
      .from('forms')
      .delete()
      .eq('user_id', userId)
      .eq('google_form_id', formId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) {
      return res.status(404).json({ error: { message: 'Form not found', code: 'FORM_NOT_FOUND' } });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const BulkArchiveSchema = z.object({
  formIds: z.array(z.string().min(1)).min(1).max(200),
  archived: z.boolean().default(true)
});

router.post('/forms/bulk/archive', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parsed = BulkArchiveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { message: 'Invalid payload', code: 'BAD_REQUEST', details: parsed.error.flatten() } });
    }

    const { formIds, archived } = parsed.data;

    const { data, error } = await supabase
      .from('forms')
      .update({ archived })
      .eq('user_id', userId)
      .in('google_form_id', formIds)
      .select('google_form_id, archived');

    if (error) {
      if (error?.code === '42703' && String(error?.message || '').includes('archived')) {
        return res.status(400).json({
          error: {
            message:
              'Archiving requires a DB migration: add public.forms.archived boolean not null default false (see supabase/schema.sql).',
            code: 'DB_MIGRATION_REQUIRED'
          }
        });
      }
      throw error;
    }
    res.json({ ok: true, updated: data || [] });
  } catch (e) {
    next(e);
  }
});

router.get('/forms/:formId', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const formId = String(req.params.formId || '').trim();
    if (!formId) return res.status(400).json({ error: { message: 'Missing formId', code: 'BAD_REQUEST' } });

    const form = await getFormForUser({ userId, formId });
    res.json(form);
  } catch (e) {
    next(e);
  }
});

const QuestionSchema = z.object({
  title: z.string().min(1).max(500),
  required: z.boolean().optional(),
  type: z.enum([
    'short_text',
    'paragraph',
    'multiple_choice',
    'checkboxes',
    'dropdown',
    'linear_scale',
    'date',
    'time'
  ]),
  choices: z.array(z.string().min(1).max(200)).optional(),
  scale: z
    .object({
      min: z.number().int().min(0).max(1).default(0),
      max: z.number().int().min(2).max(10).default(5),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional()
    })
    .optional()
});

// Unified item schema: supports question, section, image, text
const ItemSchema = z.object({
  kind: z.enum(['question', 'section', 'image', 'text']),
  title: z.string().max(500).default(''),
  description: z.string().max(5000).optional(),
  // Question-specific
  type: z.enum(['short_text', 'paragraph', 'multiple_choice', 'checkboxes', 'dropdown', 'linear_scale', 'date', 'time']).optional(),
  required: z.boolean().optional(),
  choices: z.array(z.string().min(1).max(200)).optional(),
  scale: z.object({
    min: z.number().int().min(0).max(1).default(0),
    max: z.number().int().min(2).max(10).default(5),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional()
  }).optional(),
  // Image-specific
  imageUrl: z.string().optional()
});

const UpdateFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  formType: z.enum(['survey', 'quiz', 'feedback', 'registration']).optional(),
  // Unified items array (new model)
  items: z.array(ItemSchema).optional(),
  // Legacy questions array (backward compat)
  questions: z.array(QuestionSchema).optional().default([])
});

// Multer for edit-form image uploads (QR, banners)
const editFormUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10, fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') cb(null, true);
    else cb(new Error('Only PNG and JPEG images are allowed'));
  }
});

const ImproveQuestionSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  question: z.string().min(1).max(500).optional(),
  options: z.array(z.string().min(1).max(200)).optional(),
  choices: z.array(z.string().min(1).max(200)).optional(),
  required: z.boolean().optional(),
  scale: z
    .object({
      min: z.number().int().min(0).max(1).default(0),
      max: z.number().int().min(2).max(10).default(5),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional()
    })
    .optional()
});

const FormStructureSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
  googleFormId: z.string().min(1).optional(),
  formId: z.string().min(1).optional(),
  questions: z.array(ImproveQuestionSchema).default([])
});

const ImproveFormSchema = z
  .object({
    // New field names (per user spec)
    formId: z.string().min(1).optional(),
    currentFormStructure: FormStructureSchema.optional(),
    // Legacy field names (backwards compat)
    googleFormId: z.string().min(1).optional(),
    formStructure: FormStructureSchema.optional(),
    // Shared fields
    formType: z.enum(['survey', 'quiz', 'feedback', 'registration']).optional(),
    dryRun: z.boolean().optional().default(false),
    improvementGoal: z
      .string()
      .min(3)
      .max(1000)
      .default('Improve question quality and add missing questions')
  })
  .refine((d) => d.currentFormStructure || d.formStructure, {
    message: 'currentFormStructure (or formStructure) is required'
  });

const TemplateGenerateSchema = z.object({
  templateType: z.enum([
    'event_registration',
    'job_application',
    'customer_feedback',
    'course_feedback',
    'product_survey',
    'lead_capture'
  ]),
  customization: z
    .object({
      title: z.string().max(200).optional(),
      description: z.string().max(5000).optional(),
      eventName: z.string().max(200).optional(),
      companyName: z.string().max(200).optional(),
      courseName: z.string().max(200).optional(),
      productName: z.string().max(200).optional(),
      contextName: z.string().max(200).optional()
    })
    .default({})
});

router.put('/forms/:formId', requireUser, editFormUpload.any(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const formId = String(req.params.formId || '').trim();
    if (!formId) return res.status(400).json({ error: { message: 'Missing formId', code: 'BAD_REQUEST' } });

    // When sent as multipart, items may be JSON-stringified in the body
    const body = { ...req.body };
    if (typeof body.items === 'string') {
      try { body.items = JSON.parse(body.items); } catch { body.items = []; }
    }
    if (typeof body.questions === 'string') {
      try { body.questions = JSON.parse(body.questions); } catch { body.questions = []; }
    }

    const parsed = UpdateFormSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: { message: 'Invalid payload', code: 'BAD_REQUEST', details: parsed.error.flatten() } });
    }

    const { title, description, questions, formType, items } = parsed.data;

    // Map uploaded files by fieldname (e.g. "image_3" → file at items index 3)
    const imageFiles = {};
    if (Array.isArray(req.files)) {
      for (const f of req.files) {
        imageFiles[f.fieldname] = f;
      }
    }

    const sanitizedItems = items ? sanitizeAllFileUploads(items) : undefined;
    const sanitizedQuestions = questions ? sanitizeAllFileUploads(questions) : [];

    const result = await syncFormFromSpecForUser({
      userId,
      formId,
      spec: { title, description: description || '', questions: sanitizedQuestions, items: sanitizedItems },
      formType,
      imageFiles
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

const AiEditSchema = z.object({
  prompt: z.string().min(1).max(5000),
  targetLanguage: z.string().optional(),
  currentForm: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    items: z.array(z.any()).optional(),
    questions: z.array(z.any()).optional()
  }).optional()
});

router.post('/forms/:formId/ai-edit', requireUser, validateBody(AiEditSchema), async (req, res, next) => {
  try {
    const { prompt, currentForm, targetLanguage } = req.validatedBody;
    const formId = String(req.params.formId || '').trim();

    const result = await aiEditFormSpec({ prompt, currentForm, targetLanguage });
    if (result?.updatedForm?.items) {
      result.updatedForm.items = sanitizeAllFileUploads(result.updatedForm.items);
    }
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

const OptimizeSchema = z.object({
  items: z.array(z.any()).optional(),
  targetAudience: z.string().optional(),
  language: z.string().optional()
});

router.post('/forms/:formId/optimize', requireUser, validateBody(OptimizeSchema), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const formId = String(req.params.formId || '').trim();
    const { items: bodyItems, targetAudience, language } = req.validatedBody;

    let itemsToOptimize = bodyItems;
    if (!Array.isArray(itemsToOptimize) || itemsToOptimize.length === 0) {
      if (formId && formId !== 'new' && formId !== 'draft') {
        const fetched = await getFormForUser({ userId, formId });
        itemsToOptimize = fetched?.form?.items || fetched?.form?.questions || [];
      }
    }

    const result = await optimizeFormSpec({
      items: itemsToOptimize || [],
      targetAudience: targetAudience || 'general public',
      language: language || 'English'
    });

    res.json({
      ok: true,
      original_items: itemsToOptimize || [],
      optimized_items: result.optimized_items,
      score: result.overall_score,
      overall_score: result.overall_score,
      issues: result.issues,
      summary: result.summary,
      diff: result.diff
    });
  } catch (e) {
    next(e);
  }
});

const TranslateSchema = z.object({
  texts: z.array(z.string()),
  targetLanguage: z.string().default('English')
});

router.post('/translate', requireUser, validateBody(TranslateSchema), async (req, res, next) => {
  try {
    const { texts, targetLanguage } = req.validatedBody;
    const result = await translateTexts({ texts, targetLanguage });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

const DetectLangSchema = z.object({
  texts: z.array(z.string())
});

router.post('/detect-language', requireUser, validateBody(DetectLangSchema), async (req, res, next) => {
  try {
    const { texts } = req.validatedBody;
    const result = await detectLanguage({ texts });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/forms/:formId/responses', requireUser, analyticsLimiter, getFormAnalytics);
router.post('/forms/improve', requireUser, validateBody(ImproveFormSchema), improveForm);
router.post('/forms/templates/generate', requireUser, validateBody(TemplateGenerateSchema), generateFormTemplateController);

export default router;
