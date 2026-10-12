import { defineConfig } from 'astro/config';
import { requireCompleteContent } from './src/core/build/require-complete-content';
import { site } from './src/shared/content/site';

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  // Inline all CSS: a separate stylesheet is a render-blocking request that delays the LCP text on mobile.
  build: { format: 'directory', inlineStylesheets: 'always' },
  vite: {
    server: {
      proxy: { '/api': 'http://localhost:3000' },
    },
  },
  integrations: [requireCompleteContent(site, process.env.SITE_ENV === 'production')],
});
