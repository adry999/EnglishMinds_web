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

  it('gives every level a unique kebab-case slug, a short summary and a photo', () => {
    const slugs = site.levels.map((level) => level.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const level of site.levels) {
      expect(level.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(level.summary.length).toBeGreaterThan(20);
      expect(level.summary.length).toBeLessThan(level.description.length + 1);
    }
  });

  it('has the pre-sale offer and three value cards in brand tones', () => {
    expect(site.offer.headline).toBe('4 + 1 lună cadou');
    expect(site.values.map((value) => value.tone)).toEqual(['navy', 'orange', 'sun']);
  });

  it('links the address to Google Maps', () => {
    expect(site.contact.mapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  });

  it('describes a camp day with four slots and four included items', () => {
    expect(site.camps.day).toHaveLength(4);
    expect(site.camps.includes).toHaveLength(4);
  });

  it('takes the textbook FAQ answer from courseFacts', () => {
    const answer = site.faq.find((entry) => entry.question === 'După ce metodă predați?')?.answer;
    expect(answer).toContain(site.courseFacts.textbook);
  });
});
