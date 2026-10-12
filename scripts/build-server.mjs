import { build } from 'esbuild';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { outdir: { type: 'string', default: 'dist-server' } } });

await build({
  entryPoints: {
    app: 'server/entry.node.ts',
    'purge-expired-leads': 'server/jobs/purge-expired-leads.ts',
    'notify-pending-leads': 'server/jobs/notify-pending-leads.ts',
  },
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outdir: values.outdir,
  outExtension: { '.js': '.cjs' },
  tsconfig: 'tsconfig.json',
  logLevel: 'warning',
});
