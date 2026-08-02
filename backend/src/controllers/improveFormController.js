import { asyncHandler } from '../utils/asyncHandler.js';
import { improveAndSyncFormForUser } from '../services/formImprovementService.js';

export const improveFormController = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { googleFormId, formStructure, improvementGoal, formType } = req.validatedBody;
  const resolvedFormId =
    googleFormId || formStructure?.googleFormId || formStructure?.formId;

  const result = await improveAndSyncFormForUser({
    userId,
    googleFormId: resolvedFormId,
    formStructure,
    improvementGoal,
    formType
  });

  res.json(result);
});
