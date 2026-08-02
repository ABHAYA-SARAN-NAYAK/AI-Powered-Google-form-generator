import { logger } from '../utils/logger.js';

function normalizeInfraError(err) {
  const rawMessage = String(err?.message || '');
  const code = String(err?.code || '');

  // Supabase edge/proxy outage can return a full Cloudflare HTML page (521).
  if (rawMessage.includes('Error code 521') || rawMessage.includes('Web server is down')) {
    return {
      statusCode: 503,
      code: 'SUPABASE_UNAVAILABLE',
      message: 'Supabase is temporarily unavailable (HTTP 521). Please try again in a few minutes.'
    };
  }

  // Supabase PostgREST schema cache/table missing.
  if (code === 'PGRST205' || rawMessage.includes("Could not find the table 'public.forms'")) {
    return {
      statusCode: 500,
      code: 'DB_SCHEMA_MISSING',
      message: "Database schema is missing required tables (public.forms). Run supabase/schema.sql and retry."
    };
  }

  return null;
}

export function errorHandler(err, req, res, _next) {
  const infra = normalizeInfraError(err);
  const status = infra?.statusCode || (err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500);
  const code = infra?.code || err?.code || 'INTERNAL_ERROR';
  const message = infra?.message || err?.message || 'Internal Server Error';

  if (status >= 500) {
    logger.error({ err }, 'Unhandled error');
  } else {
    logger.warn({ err }, 'Request error');
  }

  res.status(status).json({
    error: {
      message,
      code
    }
  });
}
