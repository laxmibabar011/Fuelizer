// Unified response utility for consistent API responses
// Usage: sendResponse(res, { success: true/false, data, message, error, status })
export const sendResponse = (res, { success = true, data = null, message = '', error = null, status = 200 }) => {
  const response = { success, message };
  if (success && data !== null) response.data = data;
  if (!success && error !== null) response.error = error instanceof Error ? error.message : error;
  return res.status(status).json(response);
};