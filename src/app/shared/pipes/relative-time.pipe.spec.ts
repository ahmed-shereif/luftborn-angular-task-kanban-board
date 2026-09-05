import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('returns an empty string for null/undefined/empty values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('returns an empty string for an invalid date string', () => {
    expect(pipe.transform('not-a-date')).toBe('');
  });

  it('formats a value less than 60s away in seconds', () => {
    const date = new Date(Date.now() - 30 * 1000);
    expect(pipe.transform(date)).toMatch(/second/);
  });

  it('formats a value about an hour in the past', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(pipe.transform(date)).toMatch(/hour/);
  });

  it('formats a value about a day in the future', () => {
    const date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toMatch(/day/);
  });

  it('formats a value about a week in the past', () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(date)).toMatch(/week/);
  });

  it('formats a value about a month in the past', () => {
    const date = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(date)).toMatch(/month/);
  });

  it('formats a value about a year in the past', () => {
    const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(date)).toMatch(/year/);
  });

  it('accepts a Date instance directly', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(pipe.transform(date)).toMatch(/minute/);
  });
});
