import { defineHastPlugin } from 'satteri';
import { joinBase } from '@shared/lib/with-base';

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
