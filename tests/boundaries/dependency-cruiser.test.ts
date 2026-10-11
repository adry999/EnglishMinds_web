import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const fixture = join(import.meta.dirname, 'fixture');

type Violation = { rule: { name: string }; from: string; to: string };

function cruiseFixture(): Violation[] {
  const result = spawnSync(
    process.execPath,
    [
      join(root, 'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs'),
      'src',
      'server',
      '--config',
      join(root, '.dependency-cruiser.cjs'),
      '--output-type',
      'json',
    ],
    { cwd: fixture, encoding: 'utf8' },
  );
  if (!result.stdout) throw new Error(`dependency-cruiser produced no output:\n${result.stderr}`);
  return JSON.parse(result.stdout).summary.violations;
}

describe('dependency-cruiser boundaries', () => {
  it('flags each planted violation with exactly its rule, and nothing else', () => {
    const found = cruiseFixture()
      .map((v) => `${v.rule.name} ${v.from}`)
      .sort();
    expect(found).toEqual(
      [
        'feature-to-other-feature src/features/alpha/ui/bad-cross-feature.ts',
        'feature-not-to-app src/features/beta/ui/bad-to-page.ts',
        'model-must-be-pure src/features/beta/model/bad-impure.ts',
        'pages-use-feature-index src/pages/bad-deep-page.ts',
        'server-only-contracts server/bad-leaky-server.ts',
        'shared-core-are-leaves src/shared/bad-leaky-shared.ts',
        'src-not-to-server src/shared/bad-to-server.ts',
      ].sort(),
    );
  });
});
