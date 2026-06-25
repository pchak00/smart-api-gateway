export const normalizeSearch = (value: unknown) => String(value ?? '').trim().toLowerCase();

export const matchesSearch = (fields: unknown[], query: string) => {
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) return true;

  return fields.some((field) => normalizeSearch(field).includes(normalizedQuery));
};
