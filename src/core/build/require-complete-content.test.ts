import type { AstroIntegration } from 'astro';
import { describe, expect, it, vi } from 'vitest';
import { requireCompleteContent } from './require-complete-content';

const incomplete = { name: 'Academia', phone: 'TODO', nested: { email: 'TODO' } };
const complete = { name: 'Academia', phone: '0700 000 000' };

function runStart(integration: AstroIntegration) {
  const warn = vi.fn();
  const hook = integration.hooks['astro:build:start'] as (options: unknown) => void;
  const run = () => hook({ logger: { warn } });
  return { run, warn };
}

describe('requireCompleteContent', () => {
  it('throws in production when content has TODO markers', () => {
    const { run } = runStart(requireCompleteContent(incomplete, true));
    expect(run).toThrow(/site\.ts mai are câmpuri necompletate: .*phone.*nested\.email/);
  });

  it('only warns outside production', () => {
    const { run, warn } = runStart(requireCompleteContent(incomplete, false));
    expect(run).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/site\.ts mai are câmpuri necompletate: /);
  });

  it('stays silent when content is complete', () => {
    const { run, warn } = runStart(requireCompleteContent(complete, true));
    expect(run).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });
});
