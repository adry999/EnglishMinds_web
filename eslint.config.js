import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const noDeepRelative = {
  group: ['../../*'],
  message: 'Folosește aliasurile @features/, @shared/, @core/ în loc de ../../',
};

const importRule = (...patterns) => ({ 'no-restricted-imports': ['error', { patterns: [noDeepRelative, ...patterns] }] });

const featureIndexOnly = (who) => [
  { regex: '^@features/[^/]+/.+', message: `${who} importă un feature doar prin index-ul lui: @features/<nume>.` },
  { regex: '^\\.{1,2}/(.*/)?features/', message: `${who} importă un feature doar prin @features/<nume>.` },
];

const featurePatterns = [
  {
    group: ['@features/*'],
    message: 'Un feature nu importă alt feature; folosește un CustomEvent din @shared/contracts.',
  },
  { group: ['@sections/*'], message: 'Un feature nu depinde de secțiunile paginilor.' },
  { group: ['@layouts/*'], message: 'Un feature nu depinde de layout-uri.' },
];

export default defineConfig(
  { ignores: ['dist/', 'dist-server/', '.astro/', 'tests/boundaries/fixture/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    rules: {
      ...importRule(),
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportAllDeclaration', message: 'Fără export *; exportă explicit.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: 'Doar server/config/environment.ts citește process.env.' },
      ],
    },
  },
  {
    files: ['server/config/environment.ts', 'astro.config.ts', 'server/**/*.test.ts', 'tests/support/mysql.ts', 'playwright.config.ts', 'tests/support/astro-build.ts', 'tests/deploy/**'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['src/shared/**', 'src/core/**'],
    rules: importRule(
      { group: ['@features/*'], message: 'shared/ și core/ nu depind de feature-uri.' },
      { group: ['@sections/*'], message: 'shared/ și core/ nu depind de secțiuni.' },
      { group: ['@layouts/*'], message: 'shared/ și core/ nu depind de layout-uri.' },
      {
        regex: '^\\.{1,2}/(.*/)?(features|pages|layouts|sections)/',
        message: 'shared/ și core/ nu depind de feature-uri, pagini, layout-uri sau secțiuni.',
      },
    ),
  },
  {
    files: ['src/pages/**'],
    rules: importRule(...featureIndexOnly('Paginile')),
  },
  {
    files: ['src/layouts/**'],
    rules: importRule(
      ...featureIndexOnly('Layout-urile'),
      { group: ['@sections/*'], message: 'Doar paginile și alte secțiuni importă din sections/.' },
      { regex: '^\\.{1,2}/(.*/)?sections/', message: 'Doar paginile și alte secțiuni importă din sections/.' },
    ),
  },
  {
    files: ['src/sections/**'],
    rules: importRule(
      ...featureIndexOnly('Paginile'),
      { group: ['@layouts/*'], message: 'Secțiunile nu importă layout-uri.' },
      { regex: '^\\.{1,2}/(.*/)?layouts/', message: 'Secțiunile nu importă layout-uri.' },
    ),
  },
  {
    files: ['src/features/**'],
    rules: importRule(...featurePatterns),
  },
  {
    files: ['src/features/*/*'],
    rules: importRule(...featurePatterns, {
      group: ['../*'],
      message: 'Un fișier din rădăcina unui feature nu iese din feature cu ../; folosește @shared/ sau @core/.',
    }),
  },
  {
    files: ['src/features/*/model/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'navigator',
        'localStorage',
        'sessionStorage',
        'fetch',
        'customElements',
        'HTMLElement',
      ],
    },
  },
);
