export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

const FALLBACK_DEFAULT_PAGE_LIMIT = 10;
const FALLBACK_MAX_PAGE_LIMIT = 100;

export const DEFAULT_PAGE_LIMIT = envPositiveInt('DEFAULT_PAGE_LIMIT', FALLBACK_DEFAULT_PAGE_LIMIT);
export const MAX_PAGE_LIMIT = envPositiveInt('MAX_PAGE_LIMIT', FALLBACK_MAX_PAGE_LIMIT);

export function getPagination(query: PaginationQuery = {}): PaginationResult {
  const page = positiveInt(query.page) ?? 1;
  const requestedLimit = positiveInt(query.limit) ?? DEFAULT_PAGE_LIMIT;
  const limit = Math.min(requestedLimit, MAX_PAGE_LIMIT);
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

function positiveInt(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return Math.floor(parsed);
}

function envPositiveInt(key: string, fallback: number): number {
  return positiveInt(process.env[key]) ?? fallback;
}
