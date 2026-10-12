import { defineHastPlugin } from 'satteri';
import { joinBase } from '@shared/lib/with-base';

/**
 * Sätteri hast plugin: Markdown links are root-absolute (`/cookies/`); under a base path they need the same
 * prefix as the links in components. Registers no visitor when the site is served from the root.
 */
export function prefixBasePlugin(base: string) {
  const atRoot = base.replace(/\/+$/, '') === '';
  return defineHastPlugin({
    name: 'prefix-base',
    element: atRoot
      ? []
      : [
          {
            filter: ['a', 'img'],
            visit(node, ctx) {
              for (const key of ['href', 'src']) {
                const value = node.properties[key];
                if (typeof value !== 'string') continue;
                const prefixed = joinBase(value, base);
                if (prefixed !== value) ctx.setProperty(node, key, prefixed);
              }
            },
          },
        ],
  });
}
