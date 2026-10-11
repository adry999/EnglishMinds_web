import { build } from 'esbuild';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { outfile: { type: 'string', default: 'dist-server/app.cjs' } },
});

await build({
  entryPoints: ['server/entry.node.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: values.outfile,
  tsconfig: 'tsconfig.json',
  logLevel: 'warning',
});
