import { asyncHandler } from '../utils/asyncHandler.js';
import { generateGoogleFormFromDocument } from '../services/documentFormService.js';

export const generateFromDocumentController = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const file = req.file || null;
  const text = typeof req.body?.text === 'string' ? req.body.text : '';

  const result = await generateGoogleFormFromDocument({ userId, file, text });
  res.json(result);
});
