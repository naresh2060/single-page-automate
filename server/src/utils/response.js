/**
 * Standardized API Response Utilities
 */

export const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message
  };

  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};
