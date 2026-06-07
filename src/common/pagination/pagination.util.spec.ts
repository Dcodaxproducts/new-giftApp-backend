import { getPagination, MAX_PAGE_LIMIT } from './pagination.util';

describe('getPagination', () => {
  it('defaults to page 1 and limit 10 when no limit is provided', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 10, skip: 0, take: 10 });
  });

  it('uses provided limit', () => {
    expect(getPagination({ page: 2, limit: 5 })).toEqual({ page: 2, limit: 5, skip: 5, take: 5 });
  });

  it('clamps limit to MAX_PAGE_LIMIT', () => {
    const pagination = getPagination({ limit: MAX_PAGE_LIMIT + 50 });
    expect(pagination.limit).toBe(MAX_PAGE_LIMIT);
    expect(pagination.take).toBe(MAX_PAGE_LIMIT);
  });
});
