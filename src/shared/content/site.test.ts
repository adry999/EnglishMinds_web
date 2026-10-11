import { describe, expect, it } from 'vitest';
import { AGE_GROUPS, site } from '@shared/content/site';

describe('site content', () => {
  it('has one level per age group, in order', () => {
    expect(site.levels.map((level) => level.ageGroup)).toEqual([...AGE_GROUPS]);
  });

  it('gives every level a description and outcomes', () => {
    for (const level of site.levels) {
      expect(level.description.length).toBeGreaterThan(20);
      expect(level.outcomes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps phone formats consistent', () => {
    const digits = site.contact.phoneE164.replace('+', '');
    expect(site.contact.phoneE164).toMatch(/^\+407\d{8}$/);
    expect(site.contact.phoneDisplay.replace(/\D/g, '')).toBe(digits);
    expect(site.contact.whatsappUrl).toBe(`https://wa.me/${digits}`);
  });

  it('has non-empty FAQ entries', () => {
    expect(site.faq.length).toBeGreaterThan(0);
    for (const entry of site.faq) {
      expect(entry.question.trim()).not.toBe('');
      expect(entry.answer.trim()).not.toBe('');
    }
  });
});
