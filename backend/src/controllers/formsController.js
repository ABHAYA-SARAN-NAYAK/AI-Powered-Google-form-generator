import { asyncHandler } from '../utils/asyncHandler.js';
import { improveFormWithAI } from '../services/aiFormImprovementService.js';
import { sanitizeFileUploadQuestion, sanitizeAllFileUploads } from '../utils/formHelpers.js';


/**
 * POST /api/forms/improve
 *
 * Improves an existing Google Form with Gemini AI.
 * Accepts both the "new" field names (formId, currentFormStructure) and
 * the legacy names (googleFormId, formStructure) for backwards compatibility.
 *
 * When dryRun=true the AI improvement is generated and returned WITHOUT
 * writing any changes to Google Forms or Supabase — useful for preview.
 */
export const improveForm = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  const {
    formId,
    googleFormId,
    currentFormStructure,
    formStructure,
    improvementGoal,
    dryRun = false
  } = req.validatedBody;

  // Resolve form ID — support both field name conventions
  const resolvedFormId =
    googleFormId ||
    formId ||
    currentFormStructure?.googleFormId ||
    formStructure?.googleFormId ||
    formStructure?.formId;

  // Resolve form structure — new name takes precedence
  const resolvedStructure = currentFormStructure || formStructure;

  const result = await improveFormWithAI({
    userId,
    googleFormId: resolvedFormId,
    currentFormStructure: resolvedStructure,
    improvementGoal,
    dryRun
  });

  res.json(result);
});
