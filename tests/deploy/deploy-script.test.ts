import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const script = resolve('scripts/deploy.sh');
const hasBash = spawnSync('bash', ['--version']).status === 0;

const testEnv: Record<string, string> = {
  PATH: process.env.PATH ?? '',
  DEPLOY_HOST: 'example.test',
  DEPLOY_USER: 'u',
  DEPLOY_WEB_ROOT: '/home/u/public_html',
  DEPLOY_APP_ROOT: '/home/u/em-api',
};

describe.skipIf(!hasBash)('scripts/deploy.sh --dry-run', () => {
  // The script only checks that the build outputs exist, so a stub tree keeps the test independent of the build order in `verify`.
  let work = '';
  beforeAll(() => {
    work = mkdtempSync(join(tmpdir(), 'em-deploy-'));
    mkdirSync(join(work, 'dist'));
    mkdirSync(join(work, 'dist-server'));
    for (const file of ['dist/index.html', 'dist-server/app.cjs', 'dist-server/purge-expired-leads.cjs']) {
      writeFileSync(join(work, file), '');
    }
  });
  afterAll(() => rmSync(work, { recursive: true, force: true }));

  const fails = (override: Record<string, string>) =>
    spawnSync('bash', [script, '--dry-run'], { env: { ...testEnv, ...override }, cwd: work, encoding: 'utf8' }).status;

  const run = (env: Record<string, string>) =>
    execFileSync('bash', [script, '--dry-run'], { env, cwd: work, encoding: 'utf8' });

  it('mirrors dist/ to the web root with --delete and protects api/, .well-known/ and cgi-bin/', () => {
    const mirror = run(testEnv)
      .split('\n')
      .find((line) => line.startsWith('mirror '));
    expect(mirror).toBeDefined();
    expect(mirror).toContain('--delete');
    for (const glob of ['api/', '.well-known/', 'cgi-bin/']) {
      expect(mirror).toContain(`--exclude-glob ${glob}`);
    }
    expect(mirror?.endsWith(' dist/ /home/u/public_html')).toBe(true);
  });

  it('uploads both server bundles and restart.txt into tmp/ of the app root', () => {
    const output = run(testEnv);
    expect(output).toContain('put -O /home/u/em-api dist-server/app.cjs');
    expect(output).toContain('put -O /home/u/em-api dist-server/purge-expired-leads.cjs');
    expect(output).toContain('put -O /home/u/em-api/tmp dist-server/restart.txt');
  });

  it('stops lftp on the first failed command', () => {
    expect(run(testEnv).split('\n')[1]).toBe('set cmd:fail-exit yes');
  });

  it('excludes host-managed files from the mirror', () => {
    const mirror = run(testEnv).split('\n').find((line) => line.startsWith('mirror '));
    for (const glob of ['.user.ini', 'error_log', '.htpasswds/']) {
      expect(mirror).toContain(`--exclude-glob ${glob}`);
    }
  });

  it('announces the staging auth block when DEPLOY_HTPASSWD_FILE is set, without touching dist/', () => {
    const output = run({ ...testEnv, DEPLOY_HTPASSWD_FILE: '/home/u/.htpasswds/staging/passwd' });
    expect(output).toContain('Basic auth block');
    expect(output).toContain('/home/u/.htpasswds/staging/passwd');
    expect(existsSync(join(work, 'dist/.htaccess'))).toBe(false);
    expect(existsSync(join(work, 'dist-server/restart.txt'))).toBe(false);
  });

  it('does not mention the auth block without DEPLOY_HTPASSWD_FILE', () => {
    expect(run(testEnv)).not.toContain('Basic auth');
  });

  it('rejects an unsafe htpasswd path', () => {
    expect(fails({ DEPLOY_HTPASSWD_FILE: '/home/u/x y/passwd' })).not.toBe(0);
  });

  it.each([
    ['the filesystem root', { DEPLOY_WEB_ROOT: '/' }],
    ['a bare home directory', { DEPLOY_WEB_ROOT: '/home/u' }],
    ['a relative path', { DEPLOY_WEB_ROOT: 'public_html' }],
    ['a path with a space', { DEPLOY_WEB_ROOT: '/home/u/public html' }],
    ['a path with ..', { DEPLOY_WEB_ROOT: '/home/u/../public_html' }],
    ['an app root inside the web root', { DEPLOY_APP_ROOT: '/home/u/public_html/api' }],
    ['the same web and app root', { DEPLOY_APP_ROOT: '/home/u/public_html' }],
    ['a shallow app root', { DEPLOY_APP_ROOT: '/home/u' }],
  ])('rejects %s', (_label, override) => {
    expect(fails(override)).not.toBe(0);
  });

  it('accepts a valid pair of roots', () => {
    expect(() => run(testEnv)).not.toThrow();
  });

  it('fails with a "missing" message when DEPLOY_HOST is not set', () => {
    const env = { ...testEnv };
    delete env.DEPLOY_HOST;
    const result = spawnSync('bash', [script, '--dry-run'], { env, cwd: work, encoding: 'utf8' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('missing');
  });
});
