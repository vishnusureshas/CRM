export const sendSuccess = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendPaginated = (res, data, pagination, message = 'Fetched successfully') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export const sendError = (res, statusCode, message, errors = undefined) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
