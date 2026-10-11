import { describe, expect, it } from 'vitest';
import { COOKIE_INVENTORY } from './cookie-inventory';

describe('COOKIE_INVENTORY', () => {
  it('lists the consent cookie and every cookie the banner clears on withdrawal', () => {
    const names = COOKIE_INVENTORY.map((c) => c.names).join(' ');
    for (const name of ['em_consent', '_ga', '_gid', '_fbp', '_fbc', '_gcl']) expect(names).toContain(name);
  });

  it('only uses the three banner categories and fills every column', () => {
    for (const cookie of COOKIE_INVENTORY) {
      expect(['necessary', 'analytics', 'marketing']).toContain(cookie.category);
      for (const value of Object.values(cookie)) expect(value.trim()).not.toBe('');
    }
  });
});
