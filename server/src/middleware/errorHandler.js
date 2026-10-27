import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Sanitize any accidental token leaks from error messages or stack traces
  let safeMessage = err.message || 'An unexpected error occurred';
  if (safeMessage.includes('access_token') || safeMessage.includes('EAAB') || safeMessage.includes('EAA')) {
    safeMessage = 'Facebook API authorization error. Please verify your Page Access Token.';
  }

  const statusCode = err.statusCode || (err.response ? err.response.status : 500);

  return sendError(
    res,
    safeMessage,
    statusCode >= 100 && statusCode < 600 ? statusCode : 500,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};
