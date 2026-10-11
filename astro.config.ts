import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import { findTodoMarkers } from './src/shared/content/find-todo-markers';
import { site } from './src/shared/content/site';

function requireCompleteContent(): AstroIntegration {
  return {
    name: 'require-complete-content',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const missing = findTodoMarkers(site);
        if (missing.length === 0) return;
        const message = `site.ts mai are câmpuri necompletate: ${missing.join(', ')}`;
        if (process.env.SITE_ENV === 'production') throw new Error(message);
        logger.warn(message);
      },
    },
  };
}

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [requireCompleteContent()],
});
