import { describe, expect, it } from 'vitest';
import { BLOG_CATEGORY_IDS, categoryLabel } from './categories';
import { formatPostDate } from './format-post-date';
import { readingMinutes } from './reading-minutes';
import { sortNewestFirst } from './sort-newest-first';

describe('blog model', () => {
  it('labels every category in Romanian', () => {
    expect(BLOG_CATEGORY_IDS).toEqual(['acasa', 'metoda-cambridge', 'motivatie', 'scoala']);
    expect(categoryLabel('scoala')).toBe('Școală');
    expect(categoryLabel('metoda-cambridge')).toBe('Metoda Cambridge');
  });

  it('counts reading minutes at 200 words per minute, at least one', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('cuvânt '.repeat(200))).toBe(1);
    expect(readingMinutes('cuvânt '.repeat(201))).toBe(2);
    expect(readingMinutes('  un\n\ndoi   trei  ')).toBe(1);
  });

  it('formats dates the Romanian way', () => {
    expect(formatPostDate(new Date('2026-09-01T12:00:00Z'))).toBe('1 septembrie 2026');
  });

  it('sorts posts newest first without mutating the input', () => {
    const posts = [
      { id: 'a', data: { publishedAt: new Date('2026-01-01') } },
      { id: 'b', data: { publishedAt: new Date('2026-03-01') } },
    ];
    expect(sortNewestFirst(posts).map((post) => post.id)).toEqual(['b', 'a']);
    expect(posts.map((post) => post.id)).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});
