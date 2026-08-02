import { asyncHandler } from '../utils/asyncHandler.js';
import { generateFormFromTemplateForUser } from '../services/formTemplateService.js';

export const generateFormTemplateController = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { templateType, customization } = req.validatedBody;

  const result = await generateFormFromTemplateForUser({
    userId,
    templateType,
    customization: customization || {}
  });

  res.json(result);
});
