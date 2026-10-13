import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';

function withoutViteBaseUrl(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const rest = { ...env };
  delete rest.BASE_URL;
  return rest;
}

export function buildSiteOnSameDrive(name: string, env: Record<string, string>): string {
  const parent = join(process.cwd(), 'node_modules', '.cache');
  mkdirSync(parent, { recursive: true });
  const outDir = mkdtempSync(join(parent, `em-${name}-`));
  execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir], {
    env: { ...withoutViteBaseUrl(process.env), ...env },
    stdio: 'inherit',
  });
  return outDir;
}
