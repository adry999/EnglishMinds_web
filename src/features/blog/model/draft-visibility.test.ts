import { describe, expect, it } from 'vitest';
import { draftsVisible } from './draft-visibility';

describe('draftsVisible', () => {
  it('shows drafts on the client preview', () => {
    expect(draftsVisible(false, 'preview')).toBe(true);
  });

  it('shows drafts in the dev server', () => {
    expect(draftsVisible(true, 'development')).toBe(true);
  });

  it.each(['production', 'staging', 'development'] as const)('hides drafts in a %s build', (env) => {
    expect(draftsVisible(false, env)).toBe(false);
  });
});
