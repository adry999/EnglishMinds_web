import type { AstroIntegration } from 'astro';
import { findTodoMarkers } from '@shared/content/find-todo-markers';

export function requireCompleteContent(content: unknown, isProduction: boolean): AstroIntegration {
  return {
    name: 'require-complete-content',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const missing = findTodoMarkers(content);
        if (missing.length === 0) return;
        const message = `site.ts mai are câmpuri necompletate: ${missing.join(', ')}`;
        if (isProduction) throw new Error(message);
        logger.warn(message);
      },
    },
  };
}
