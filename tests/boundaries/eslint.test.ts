import { ESLint } from 'eslint';
import { describe, expect, it, vi } from 'vitest';

// The first lint of a typescript-eslint + astro config loads the whole plugin set; allow for a cold start.
vi.setConfig({ testTimeout: 60_000 });

const eslint = new ESLint();

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId ?? `fatal: ${message.message}`);
}

const astroImport = (specifier: string) => `---\nimport X from '${specifier}';\n---\n<p>{X}</p>\n`;

describe('eslint boundaries', () => {
  it('rejects deep feature imports from an .astro page', async () => {
    expect(await ruleIds(astroImport('@features/faq/ui/Faq.astro'), 'src/pages/x.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('allows a page to import a feature index', async () => {
    expect(await ruleIds(astroImport('@features/faq'), 'src/pages/x.astro')).toEqual([]);
  });

  it('rejects a feature importing another feature', async () => {
    expect(await ruleIds(astroImport('@features/faq'), 'src/features/blog/ui/A.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('rejects ../../ imports', async () => {
    expect(
      await ruleIds("import { a } from '../../features/x';\nexport const b = a;\n", 'src/shared/ui/x.ts'),
    ).toContain('no-restricted-imports');
  });

  it('rejects export *', async () => {
    expect(await ruleIds("export * from './a';\n", 'src/shared/x.ts')).toContain('no-restricted-syntax');
  });

  it('rejects DOM globals in model/', async () => {
    expect(
      await ruleIds('export const w = window.innerWidth;\n', 'src/features/level-test/model/m.ts'),
    ).toContain('no-restricted-globals');
  });

  it('rejects an empty catch', async () => {
    expect(
      await ruleIds('export function f(g: () => void) {\n  try { g(); } catch {}\n}\n', 'src/shared/x.ts'),
    ).toContain('no-empty');
  });

  it('rejects a relative feature import from an .astro page', async () => {
    expect(await ruleIds(astroImport('../features/faq/ui/Faq.astro'), 'src/pages/x.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('allows a relative layout import from an .astro page', async () => {
    expect(await ruleIds(astroImport('../layouts/BaseLayout.astro'), 'src/pages/x.astro')).toEqual([]);
  });

  it('rejects a feature-root file leaving its feature with ../', async () => {
    expect(await ruleIds(astroImport('../beta/index'), 'src/features/alpha/X.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('allows a feature subfolder file importing a sibling folder', async () => {
    expect(await ruleIds(astroImport('../model/m'), 'src/features/alpha/ui/A.astro')).toEqual([]);
  });

  it('rejects shared/ importing a feature', async () => {
    expect(await ruleIds(astroImport('@features/faq'), 'src/shared/ui/Y.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('rejects core/ importing a feature relatively', async () => {
    expect(
      await ruleIds("import { a } from '../features/faq/index';\nexport const b = a;\n", 'src/core/x.ts'),
    ).toContain('no-restricted-imports');
  });

  it('allows shared/ importing a sibling and shared content', async () => {
    expect(await ruleIds(astroImport('./Logo.astro'), 'src/shared/ui/Y.astro')).toEqual([]);
    expect(await ruleIds(astroImport('@shared/content/site'), 'src/shared/ui/Y.astro')).toEqual([]);
  });

  it('rejects process.env outside the environment module', async () => {
    expect(await ruleIds('export const p = process.env.X;\n', 'src/shared/x.ts')).toContain(
      'no-restricted-properties',
    );
  });

  it('rejects deep feature imports from a section', async () => {
    expect(await ruleIds(astroImport('@features/faq/ui/Faq.astro'), 'src/sections/home/Hero.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('allows a section to import a feature index and shared UI', async () => {
    expect(await ruleIds(astroImport('@features/faq'), 'src/sections/home/Hero.astro')).toEqual([]);
    expect(await ruleIds(astroImport('@shared/ui/Photo.astro'), 'src/sections/home/Hero.astro')).toEqual([]);
  });

  it('rejects shared UI importing a section', async () => {
    expect(await ruleIds(astroImport('../../sections/home/Hero.astro'), 'src/shared/ui/X.astro')).toContain(
      'no-restricted-imports',
    );
    expect(await ruleIds(astroImport('@sections/home/Hero.astro'), 'src/shared/ui/X.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('rejects a feature importing a section', async () => {
    expect(await ruleIds(astroImport('@sections/home/Hero.astro'), 'src/features/blog/ui/A.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('rejects a layout importing a section', async () => {
    expect(await ruleIds(astroImport('@sections/home/Hero.astro'), 'src/layouts/BaseLayout.astro')).toContain(
      'no-restricted-imports',
    );
    expect(await ruleIds(astroImport('../sections/home/Hero.astro'), 'src/layouts/BaseLayout.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('still rejects deep feature imports from a layout', async () => {
    expect(await ruleIds(astroImport('@features/faq/ui/Faq.astro'), 'src/layouts/BaseLayout.astro')).toContain(
      'no-restricted-imports',
    );
  });

  it('allows pages and sections to import sections', async () => {
    expect(await ruleIds(astroImport('@sections/home/Hero.astro'), 'src/pages/x.astro')).toEqual([]);
    expect(await ruleIds(astroImport('@sections/home/Hero.astro'), 'src/sections/home/Other.astro')).toEqual([]);
  });

  it('rejects shared UI and features importing a layout, allows pages', async () => {
    expect(await ruleIds(astroImport('@layouts/BaseLayout.astro'), 'src/shared/ui/X.astro')).toContain(
      'no-restricted-imports',
    );
    expect(await ruleIds(astroImport('@layouts/BaseLayout.astro'), 'src/features/blog/ui/A.astro')).toContain(
      'no-restricted-imports',
    );
    expect(await ruleIds(astroImport('@layouts/BaseLayout.astro'), 'src/pages/x.astro')).toEqual([]);
  });
});
