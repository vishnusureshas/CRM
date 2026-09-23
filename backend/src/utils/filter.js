// Generic helpers for building Prisma where clauses — §21 Filtering

export const buildDateRange = (from, to) => {
  if (!from && !to) return undefined;
  const range = {};
  if (from) range.gte = new Date(from);
  if (to) range.lte = new Date(to);
  return range;
};

export const buildSearchOr = (search, fields) => {
  if (!search) return undefined;
  return fields.map((field) => ({
    [field]: { contains: search, mode: 'insensitive' },
  }));
};
