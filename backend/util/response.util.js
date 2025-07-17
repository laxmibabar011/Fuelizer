export const sendSuccess = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, error, message = 'Error', status = 500) => {
  return res.status(status).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
  });
};