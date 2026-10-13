import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
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
  let stubBuildTree = '';
  beforeAll(() => {
    stubBuildTree = mkdtempSync(join(tmpdir(), 'em-deploy-'));
    mkdirSync(join(stubBuildTree, 'dist'));
    mkdirSync(join(stubBuildTree, 'dist-server'));
    for (const file of ['dist/index.html', 'dist-server/app.cjs', 'dist-server/purge-expired-leads.cjs', 'dist-server/notify-pending-leads.cjs']) {
      writeFileSync(join(stubBuildTree, file), '');
    }
  });
  afterAll(() => rmSync(stubBuildTree, { recursive: true, force: true }));

  const fails = (override: Record<string, string>) =>
    spawnSync('bash', [script, '--dry-run'], { env: { ...testEnv, ...override }, cwd: stubBuildTree, encoding: 'utf8' }).status;

  const run = (env: Record<string, string>) =>
    execFileSync('bash', [script, '--dry-run'], { env, cwd: stubBuildTree, encoding: 'utf8' });

  it('mirrors dist/ to the web root in two passes, the second with --delete, and protects host-owned files and folders', () => {
    const mirrors = run(testEnv)
      .split('\n')
      .filter((line) => line.startsWith('mirror '));
    expect(mirrors).toHaveLength(2);
    expect(mirrors[0]).not.toContain('--delete');
    expect(mirrors[1]).toContain('--delete');
    for (const mirror of mirrors) {
      for (const glob of ['api/', '.well-known/', 'cgi-bin/', '.user.ini', 'error_log', '.htpasswds/']) {
        expect(mirror).toContain(`--exclude-glob ${glob}`);
      }
      expect(mirror.endsWith(' dist/ /home/u/public_html')).toBe(true);
    }
  });

  it('uploads both server bundles and restart.txt into tmp/ of the app root', () => {
    const output = run(testEnv);
    expect(output).toContain('put -O /home/u/em-api dist-server/app.cjs');
    expect(output).toContain('put -O /home/u/em-api dist-server/purge-expired-leads.cjs');
    expect(output).toContain('put -O /home/u/em-api dist-server/notify-pending-leads.cjs');
    expect(output).toContain('put -O /home/u/em-api/tmp dist-server/restart.txt');
  });

  it('creates tmp/ before enabling fail-exit, so an existing directory cannot abort the run', () => {
    const lines = run(testEnv).split('\n');
    const mkdir = lines.indexOf('mkdir -p -f /home/u/em-api/tmp');
    const failExit = lines.indexOf('set cmd:fail-exit yes');
    expect(mkdir).toBeGreaterThan(-1);
    expect(failExit).toBeGreaterThan(mkdir);
  });

  it('announces the staging auth block when DEPLOY_HTPASSWD_FILE is set, without touching dist/', () => {
    const output = run({ ...testEnv, DEPLOY_HTPASSWD_FILE: '/home/u/.htpasswds/staging/passwd' });
    expect(output).toContain('Basic auth block');
    expect(output).toContain('/home/u/.htpasswds/staging/passwd');
    expect(existsSync(join(stubBuildTree, 'dist/.htaccess'))).toBe(false);
    expect(existsSync(join(stubBuildTree, 'dist-server/restart.txt'))).toBe(false);
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
    ['a trailing dot segment', { DEPLOY_WEB_ROOT: '/home/u/.' }],
    ['an inner dot segment', { DEPLOY_WEB_ROOT: '/home/./u/public_html' }],
    ['an empty segment', { DEPLOY_WEB_ROOT: '/home//u/public_html' }],
    ['a trailing slash', { DEPLOY_WEB_ROOT: '/home/u/public_html/' }],
    ['a semicolon', { DEPLOY_WEB_ROOT: '/home/u/x;rm' }],
    ['a pipe', { DEPLOY_WEB_ROOT: '/home/u/x|sh' }],
    ['a hash', { DEPLOY_WEB_ROOT: '/home/u/x#y' }],
    ['a dollar sign', { DEPLOY_WEB_ROOT: '/home/u/x$y' }],
    ['a quote', { DEPLOY_WEB_ROOT: "/home/u/x'y" }],
    ['a path with ..', { DEPLOY_WEB_ROOT: '/home/u/../public_html' }],
    ['an app root inside the web root', { DEPLOY_APP_ROOT: '/home/u/public_html/api' }],
    ['the same web and app root', { DEPLOY_APP_ROOT: '/home/u/public_html' }],
    ['a shallow app root', { DEPLOY_APP_ROOT: '/home/u' }],
  ])('rejects %s', (_label, override) => {
    expect(fails(override)).not.toBe(0);
  });

  it('fails with a "missing" message when DEPLOY_HOST is not set', () => {
    const env = { ...testEnv };
    delete env.DEPLOY_HOST;
    const result = spawnSync('bash', [script, '--dry-run'], { env, cwd: stubBuildTree, encoding: 'utf8' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('missing');
  });
});

function writeLftpStub(path: string): void {
  writeFileSync(path, '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > lftp-args.txt\ncp dist/.htaccess htaccess-seen.txt 2>/dev/null || true\n');
  chmodSync(path, 0o755);
}

describe.skipIf(!hasBash)('scripts/deploy.sh real run with a stub lftp', () => {
  const originalHtaccess = 'Options -Indexes\n';
  let work = '';
  let env: Record<string, string> = {};
  const read = (file: string) => readFileSync(join(work, file), 'utf8');
  const deploy = (extra: Record<string, string> = {}) =>
    spawnSync('bash', [script], { env: { ...env, ...extra }, cwd: work, encoding: 'utf8' });

  beforeAll(() => {
    work = mkdtempSync(join(tmpdir(), 'em-deploy-real-'));
    for (const dir of ['dist', 'dist-server', 'bin']) mkdirSync(join(work, dir));
    for (const file of ['dist/index.html', 'dist-server/app.cjs', 'dist-server/purge-expired-leads.cjs', 'dist-server/notify-pending-leads.cjs', 'key', 'known_hosts']) {
      writeFileSync(join(work, file), '');
    }
    writeLftpStub(join(work, 'bin', 'lftp'));
    env = {
      ...testEnv,
      PATH: `${join(work, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      DEPLOY_KEY_FILE: join(work, 'key').replaceAll('\\', '/'),
      DEPLOY_KNOWN_HOSTS_FILE: join(work, 'known_hosts').replaceAll('\\', '/'),
    };
  });
  afterAll(() => rmSync(work, { recursive: true, force: true }));

  it('runs lftp with both mirror passes and the uploads, and creates restart.txt', () => {
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    const args = read('lftp-args.txt');
    expect(args).toContain('sftp://example.test');
    expect(args.match(/^mirror /gm)).toHaveLength(2);
    expect(args).toContain('mirror --reverse --delete');
    expect(args).toContain('put -O /home/u/em-api dist-server/app.cjs');
    expect(args).toContain('put -O /home/u/em-api/tmp dist-server/restart.txt');
    expect(existsSync(join(work, 'dist-server/restart.txt'))).toBe(true);
    expect(existsSync(join(work, 'dist/.htaccess'))).toBe(false);
  });

  it('injects the staging auth block only while lftp runs and restores dist/.htaccess, also when run twice', () => {
    writeFileSync(join(work, 'dist/.htaccess'), originalHtaccess);
    const htpasswd = { DEPLOY_HTPASSWD_FILE: '/home/u/.htpasswds/staging/passwd' };
    for (let run = 0; run < 2; run++) {
      const result = deploy(htpasswd);
      expect(result.status, result.stderr).toBe(0);
      const seen = read('htaccess-seen.txt');
      expect(seen.startsWith(originalHtaccess)).toBe(true);
      expect(seen).toContain('AuthUserFile /home/u/.htpasswds/staging/passwd');
      expect(seen).toContain('Require env acme_challenge');
      expect(seen).toContain('<RequireAny>');
      expect(seen.match(/AuthUserFile/g)).toHaveLength(1);
      expect(read('dist/.htaccess')).toBe(originalHtaccess);
    }
  });

  it('does not inject again when the build already contains an AuthUserFile', () => {
    const withAuth = 'AuthUserFile /x/passwd\n';
    writeFileSync(join(work, 'dist/.htaccess'), withAuth);
    const result = deploy({ DEPLOY_HTPASSWD_FILE: '/home/u/.htpasswds/staging/passwd' });
    expect(result.status, result.stderr).toBe(0);
    expect(read('htaccess-seen.txt')).toBe(withAuth);
    expect(read('dist/.htaccess')).toBe(withAuth);
  });
});
