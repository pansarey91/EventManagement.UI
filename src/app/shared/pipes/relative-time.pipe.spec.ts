import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null or undefined or empty', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(pipe.transform('invalid-date-string')).toBe('');
  });

  it('should return "Just now" for dates in the future or within 60 seconds', () => {
    const now = new Date();
    expect(pipe.transform(now)).toBe('Just now');

    const future = new Date(now.getTime() + 10000);
    expect(pipe.transform(future)).toBe('Just now');

    const thirtySecsAgo = new Date(now.getTime() - 30 * 1000);
    expect(pipe.transform(thirtySecsAgo)).toBe('Just now');
  });

  it('should return minutes ago for less than 60 minutes', () => {
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    expect(pipe.transform(tenMinsAgo)).toBe('10m ago');
  });

  it('should return hours ago for less than 24 hours', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
    expect(pipe.transform(threeHoursAgo)).toBe('3h ago');
  });

  it('should return "Yesterday" for 1 day ago', () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 25 * 3600 * 1000);
    expect(pipe.transform(oneDayAgo)).toBe('Yesterday');
  });

  it('should return days ago for less than 7 days', () => {
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 3600 * 1000);
    expect(pipe.transform(fourDaysAgo)).toBe('4d ago');
  });

  it('should return localized date for 7 or more days ago', () => {
    const oldDate = new Date(2020, 0, 15);
    const result = pipe.transform(oldDate);
    expect(result).toBeTruthy();
    expect(result).toContain('2020');
  });
});
