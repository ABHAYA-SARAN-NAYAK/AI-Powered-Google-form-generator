import rateLimit from 'express-rate-limit';

export const generateFormLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMITED' } }
});

// Analytics endpoint: 30 req/min — each call may trigger a Google API + Gemini call
export const analyticsLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many analytics requests', code: 'RATE_LIMITED' } }
});
