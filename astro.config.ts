import { defineConfig } from 'astro/config';
import { requireCompleteContent } from './src/core/build/require-complete-content';
import { site } from './src/shared/content/site';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [requireCompleteContent(site, process.env.SITE_ENV === 'production')],
});
