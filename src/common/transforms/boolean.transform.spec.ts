import { optionalBoolean } from './boolean.transform';

describe('optionalBoolean', () => {
  it('preserves omitted values for optional query filters', () => {
    expect(optionalBoolean(undefined)).toBeUndefined();
    expect(optionalBoolean(null)).toBeUndefined();
    expect(optionalBoolean('')).toBeUndefined();
  });

  it('parses explicit boolean query strings without turning false into true', () => {
    expect(optionalBoolean('true')).toBe(true);
    expect(optionalBoolean('false')).toBe(false);
    expect(optionalBoolean(true)).toBe(true);
    expect(optionalBoolean(false)).toBe(false);
  });

  it('leaves invalid values for class-validator to reject', () => {
    expect(optionalBoolean('not-a-boolean')).toBe('not-a-boolean');
  });
});
