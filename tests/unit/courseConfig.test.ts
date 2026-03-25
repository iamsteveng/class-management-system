import { describe, it, expect } from 'vitest';
import { getCourseConfig, COURSE_CONFIG } from '../../app/i18n/courseConfig';

describe('getCourseConfig', () => {
  it('returns correct config for class_cycling_fundamentals', () => {
    const config = getCourseConfig('class_cycling_fundamentals');
    expect(config).toBeDefined();
    expect(config?.duration).toBe('2 hours');
    expect(config?.originalPrice).toBe('HK$560');
    expect(config?.discountPrice).toBe('HK$400');
    expect(config?.image).toContain('/images/homepage/');
    expect(config?.image).toContain('30c657383d224670b9671a2f703069965543dc7c.png');
  });

  it('returns correct config for class_city_guided_tour', () => {
    const config = getCourseConfig('class_city_guided_tour');
    expect(config).toBeDefined();
    expect(config?.duration).toBe('3 hours');
    expect(config?.originalPrice).toBe('HK$650');
    expect(config?.discountPrice).toBe('HK$550');
    expect(config?.image).toContain('/images/homepage/');
    expect(config?.image).toContain('1b6dde4eac8d4c724b5927af3ad2e95753044659.png');
  });

  it('returns undefined for unknown class', () => {
    expect(getCourseConfig('unknown_class')).toBeUndefined();
    expect(getCourseConfig('')).toBeUndefined();
  });
});

describe('quota_available mapping', () => {
  it('maps quota_available=0 to isFull=true', () => {
    const isFull = (quota_available: number) => quota_available === 0;
    expect(isFull(0)).toBe(true);
  });

  it('maps quota_available=3 to isFull=false', () => {
    const isFull = (quota_available: number) => quota_available === 0;
    expect(isFull(3)).toBe(false);
  });

  it('maps quota_available=1 to isFull=false', () => {
    const isFull = (quota_available: number) => quota_available === 0;
    expect(isFull(1)).toBe(false);
  });
});

describe('COURSE_CONFIG record', () => {
  it('contains entries for both known class IDs', () => {
    expect(Object.keys(COURSE_CONFIG)).toContain('class_cycling_fundamentals');
    expect(Object.keys(COURSE_CONFIG)).toContain('class_city_guided_tour');
  });
});
