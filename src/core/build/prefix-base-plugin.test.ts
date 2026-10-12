import { describe, expect, it, vi } from 'vitest';
import { prefixBasePlugin } from './prefix-base-plugin';

type Visitor = { visit(node: unknown, ctx: unknown): void };

function run(base: string, properties: Record<string, unknown>) {
  const setProperty = vi.fn();
  const [visitor] = prefixBasePlugin(base).element as Visitor[];
  visitor?.visit({ properties }, { setProperty });
  return setProperty;
}

describe('prefixBasePlugin', () => {
  it('prefixes root-absolute href and src with the base', () => {
    expect(run('/EnglishMinds_web', { href: '/cookies/' })).toHaveBeenCalledWith(expect.anything(), 'href', '/EnglishMinds_web/cookies/');
    expect(run('/EnglishMinds_web/', { src: '/img/a.png' })).toHaveBeenCalledWith(expect.anything(), 'src', '/EnglishMinds_web/img/a.png');
  });

  it('leaves external, fragment and missing values alone', () => {
    expect(run('/EnglishMinds_web', { href: 'https://x.ro/' })).not.toHaveBeenCalled();
    expect(run('/EnglishMinds_web', { href: '#a' })).not.toHaveBeenCalled();
    expect(run('/EnglishMinds_web', {})).not.toHaveBeenCalled();
  });

  it('registers no visitor when the site is served from the root', () => {
    expect(prefixBasePlugin('/').element).toEqual([]);
  });
});
