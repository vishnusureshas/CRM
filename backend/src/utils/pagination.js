export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { page, limit, skip, sortBy, sortOrder };
};

export const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export const paginatedResponse = async (model, where, { page, limit, skip }, orderBy, include) => {
  const [data, total] = await Promise.all([
    model.findMany({ where, skip, take: limit, orderBy, include }),
    model.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};
