import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const noDeepRelative = {
  group: ['../../*'],
  message: 'Folosește aliasurile @features/, @shared/, @core/ în loc de ../../',
};

export default defineConfig(
  { ignores: ['dist/', 'dist-server/', '.astro/', 'design/', 'tests/boundaries/fixture/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    rules: {
      'no-restricted-imports': ['error', { patterns: [noDeepRelative] }],
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportAllDeclaration', message: 'Fără export *; exportă explicit.' },
      ],
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
  {
    files: ['src/pages/**', 'src/layouts/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepRelative,
            {
              regex: '^@features/[^/]+/.+',
              message: 'Paginile importă un feature doar prin index-ul lui: @features/<nume>.',
            },
            {
              regex: '^\\.{1,2}/(.*/)?features/',
              message: 'Paginile importă un feature doar prin @features/<nume>.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepRelative,
            {
              group: ['@features/*'],
              message: 'Un feature nu importă alt feature; folosește un CustomEvent din @shared/contracts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/*/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noDeepRelative,
            {
              group: ['@features/*'],
              message: 'Un feature nu importă alt feature; folosește un CustomEvent din @shared/contracts.',
            },
            {
              group: ['../*'],
              message: 'Un fișier din rădăcina unui feature nu iese din feature cu ../; folosește @shared/ sau @core/.',
            },
          ],
        },
      ],
    },
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
