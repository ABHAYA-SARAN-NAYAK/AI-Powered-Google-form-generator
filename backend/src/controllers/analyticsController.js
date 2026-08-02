import { asyncHandler } from '../utils/asyncHandler.js';
import { getFormAnalyticsForUser } from '../services/analyticsService.js';

/**
 * GET /api/forms/:formId/responses
 *
 * Returns aggregated analytics + AI insights for a Google Form the user owns.
 *
 * Query params:
 *   noCache=1   → bypass Supabase cache (force fresh fetch from Google)
 *   noAI=1      → skip Gemini AI insights generation (faster)
 */
export const getFormAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const formId = String(req.params.formId || '').trim();

  if (!formId) {
    return res.status(400).json({ error: { message: 'Missing formId', code: 'BAD_REQUEST' } });
  }

  const noCache = req.query.noCache === '1' || req.query.noCache === 'true';
  const noAI = req.query.noAI === '1' || req.query.noAI === 'true';

  const result = await getFormAnalyticsForUser({ userId, formId, noCache, noAI });

  res.json(result);
});
