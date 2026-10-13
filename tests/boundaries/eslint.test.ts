import { ESLint } from 'eslint';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

const eslint = new ESLint();

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId ?? `fatal: ${message.message}`);
}

const astroImport = (specifier: string) => `---\nimport X from '${specifier}';\n---\n<p>{X}</p>\n`;
const tsImport = (specifier: string) => `import { a } from '${specifier}';\nexport const b = a;\n`;

const IMPORT_RULE = 'no-restricted-imports';
const FAQ_UI = '@features/faq/ui/Faq.astro';
const HERO = '@sections/home/Hero.astro';
const LAYOUT = '@layouts/BaseLayout.astro';

const cases: [label: string, code: string, filePath: string, expected: string | null][] = [
  ['rejects deep feature imports from an .astro page', astroImport(FAQ_UI), 'src/pages/x.astro', IMPORT_RULE],
  ['allows a page to import a feature index', astroImport('@features/faq'), 'src/pages/x.astro', null],
  ['rejects a feature importing another feature', astroImport('@features/faq'), 'src/features/blog/ui/A.astro', IMPORT_RULE],
  ['rejects ../../ imports', tsImport('../../features/x'), 'src/shared/ui/x.ts', IMPORT_RULE],
  ['rejects export *', "export * from './a';\n", 'src/shared/x.ts', 'no-restricted-syntax'],
  ['rejects an empty catch', 'export function f(g: () => void) {\n  try { g(); } catch {}\n}\n', 'src/shared/x.ts', 'no-empty'],
  ['rejects DOM globals in model/', 'export const w = window.innerWidth;\n', 'src/features/level-test/model/m.ts', 'no-restricted-globals'],
  ['rejects a relative feature import from an .astro page', astroImport('../features/faq/ui/Faq.astro'), 'src/pages/x.astro', IMPORT_RULE],
  ['allows a relative layout import from an .astro page', astroImport('../layouts/BaseLayout.astro'), 'src/pages/x.astro', null],
  ['rejects a feature-root file leaving its feature with ../', astroImport('../beta/index'), 'src/features/alpha/X.astro', IMPORT_RULE],
  ['allows a feature subfolder file importing a sibling folder', astroImport('../model/m'), 'src/features/alpha/ui/A.astro', null],
  ['rejects shared/ importing a feature', astroImport('@features/faq'), 'src/shared/ui/Y.astro', IMPORT_RULE],
  ['rejects core/ importing a feature relatively', tsImport('../features/faq/index'), 'src/core/x.ts', IMPORT_RULE],
  ['allows shared/ importing a sibling', astroImport('./Logo.astro'), 'src/shared/ui/Y.astro', null],
  ['allows shared/ importing shared content', astroImport('@shared/content/site'), 'src/shared/ui/Y.astro', null],
  ['rejects process.env outside the environment module', 'export const p = process.env.X;\n', 'src/shared/x.ts', 'no-restricted-properties'],
  ['rejects deep feature imports from a section', astroImport(FAQ_UI), 'src/sections/home/Hero.astro', IMPORT_RULE],
  ['allows a section to import a feature index', astroImport('@features/faq'), 'src/sections/home/Hero.astro', null],
  ['allows a section to import shared UI', astroImport('@shared/ui/Photo.astro'), 'src/sections/home/Hero.astro', null],
  ['rejects shared UI importing a section by relative path', astroImport('../../sections/home/Hero.astro'), 'src/shared/ui/X.astro', IMPORT_RULE],
  ['rejects shared UI importing a section by alias', astroImport(HERO), 'src/shared/ui/X.astro', IMPORT_RULE],
  ['rejects a feature importing a section', astroImport(HERO), 'src/features/blog/ui/A.astro', IMPORT_RULE],
  ['rejects a layout importing a section by alias', astroImport(HERO), 'src/layouts/BaseLayout.astro', IMPORT_RULE],
  ['rejects a layout importing a section by relative path', astroImport('../sections/home/Hero.astro'), 'src/layouts/BaseLayout.astro', IMPORT_RULE],
  ['rejects a section importing a layout by alias', astroImport(LAYOUT), 'src/sections/home/Hero.astro', IMPORT_RULE],
  ['rejects a section importing a layout by relative path', astroImport('../../layouts/BaseLayout.astro'), 'src/sections/home/Hero.astro', IMPORT_RULE],
  ['rejects deep feature imports from a layout', astroImport(FAQ_UI), 'src/layouts/BaseLayout.astro', IMPORT_RULE],
  ['allows pages to import sections', astroImport(HERO), 'src/pages/x.astro', null],
  ['allows sections to import sections', astroImport(HERO), 'src/sections/home/Other.astro', null],
  ['rejects shared UI importing a layout', astroImport(LAYOUT), 'src/shared/ui/X.astro', IMPORT_RULE],
  ['rejects a feature importing a layout', astroImport(LAYOUT), 'src/features/blog/ui/A.astro', IMPORT_RULE],
  ['allows pages to import layouts', astroImport(LAYOUT), 'src/pages/x.astro', null],
];

describe('eslint boundaries', () => {
  it.each(cases)('%s', async (_label, code, filePath, expected) => {
    const ids = await ruleIds(code, filePath);
    if (expected === null) expect(ids).toEqual([]);
    else expect(ids).toContain(expected);
  });
});
