import { defineConfig } from 'astro/config';
import { requireCompleteContent } from './src/core/build/require-complete-content';
import { site } from './src/shared/content/site';

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: {
    server: {
      proxy: { '/api': 'http://localhost:3000' },
    },
  },
  integrations: [requireCompleteContent(site, process.env.SITE_ENV === 'production')],
});
