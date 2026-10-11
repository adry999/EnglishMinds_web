import { describe, expect, it } from 'vitest';
import { photos } from '@shared/content/photos';
import { site } from '@shared/content/site';

describe('photos', () => {
  it('resolves every photo used by a level', () => {
    for (const level of site.levels) {
      expect(photos[level.photo].width).toBeGreaterThan(0);
    }
  });

  it('includes Ema', () => {
    expect(photos.emaReading.width).toBeGreaterThan(0);
  });
});
