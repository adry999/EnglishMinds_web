import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/check-rollback-target.sh');
const hasTools = spawnSync('bash', ['--version']).status === 0 && spawnSync('git', ['--version']).status === 0;

describe.skipIf(!hasTools)('scripts/check-rollback-target.sh', () => {
  let work = '';
  let clone = '';
  let output = '';
  let checksFile = '';
  const commits: Record<string, string> = {};

  const git = (cwd: string, ...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.test', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args], {
      cwd,
      encoding: 'utf8',
    }).trim();

  const commit = (cwd: string, name: string) => {
    writeFileSync(join(cwd, `${name}.txt`), name);
    git(cwd, 'add', '.');
    git(cwd, 'commit', '-q', '-m', name);
    commits[name] = git(cwd, 'rev-parse', 'HEAD');
  };

  const checks = (value: string) => writeFileSync(checksFile, value);

  const run = (target: string, ref: string) =>
    spawnSync('bash', [script], {
      cwd: clone,
      encoding: 'utf8',
      env: {
        PATH: `${join(work, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
        HOME: work,
        TARGET: target,
        REF: ref,
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_OUTPUT: output,
        CHECKS_FILE: checksFile,
      },
    });

  beforeAll(() => {
    work = mkdtempSync(join(tmpdir(), 'em-rollback-'));
    const origin = join(work, 'origin.git');
    const seed = join(work, 'seed');
    clone = join(work, 'clone');
    mkdirSync(join(work, 'bin'));
    checksFile = join(work, 'checks.txt');
    output = join(work, 'github-output.txt');
    writeFileSync(
      join(work, 'bin', 'gh'),
      '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$(dirname "$CHECKS_FILE")/gh-args.txt"\ncat "$CHECKS_FILE"\n',
    );
    chmodSync(join(work, 'bin', 'gh'), 0o755);

    git(work, 'init', '-q', '--bare', origin);
    mkdirSync(seed);
    git(seed, 'init', '-q', '-b', 'main');
    commit(seed, 'first');
    commit(seed, 'second');
    git(seed, 'tag', 'v1', commits.first ?? '');
    git(seed, 'checkout', '-q', '-b', 'staging');
    commit(seed, 'staging-only');
    git(seed, 'checkout', '-q', 'main');
    git(seed, 'checkout', '-q', '-b', 'feature');
    commit(seed, 'unmerged');
    git(seed, 'remote', 'add', 'origin', origin);
    git(seed, 'push', '-q', 'origin', 'main', 'staging', 'feature', '--tags');
    git(work, 'clone', '-q', origin, clone);
  });
  afterAll(() => rmSync(work, { recursive: true, force: true }));
  beforeEach(() => {
    writeFileSync(output, '');
    checks('verify=success\nbrowser=success\n');
  });

  it('accepts a commit on main with green CI for production and writes its SHA as an output', () => {
    const result = run('production', commits.first ?? '');
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(output, 'utf8')).toBe(`sha=${commits.first}\n`);
    expect(readFileSync(join(work, 'gh-args.txt'), 'utf8')).toContain(`repos/owner/repo/commits/${commits.first}/check-runs`);
  });

  it('resolves a tag to its commit', () => {
    const result = run('production', 'v1');
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(output, 'utf8')).toBe(`sha=${commits.first}\n`);
  });

  it('accepts a staging-only commit for staging', () => {
    expect(run('staging', commits['staging-only'] ?? '').status).toBe(0);
  });

  it.each([
    ['a staging-only commit for production', 'production', 'staging-only'],
    ['a commit that was never merged', 'production', 'unmerged'],
    ['an unmerged commit for staging', 'staging', 'unmerged'],
  ])('refuses %s, because it was never published there', (_label, target, name) => {
    const result = run(target, commits[name] ?? '');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('is not on');
    expect(readFileSync(output, 'utf8')).toBe('');
  });

  it.each([
    ['a failed check', 'verify=success\nbrowser=failure\n'],
    ['a missing check', 'verify=success\n'],
    ['a check that is still running', 'verify=success\nbrowser=null\n'],
  ])('refuses a commit with %s', (_label, value) => {
    checks(value);
    const result = run('production', commits.second ?? '');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('did not pass');
    expect(readFileSync(output, 'utf8')).toBe('');
  });

  it.each([
    ['an unknown target', 'preview', 'v1', 'production or staging'],
    ['a ref that does not exist', 'production', 'deadbeef', 'not a commit'],
    ['a ref starting with a dash', 'production', '--upload-pack=x', 'commit SHA or a tag'],
    ['a ref with shell characters', 'production', 'v1;id', 'commit SHA or a tag'],
    ['a range instead of a commit', 'production', 'v1..main', 'commit SHA or a tag'],
  ])('refuses %s', (_label, target, ref, message) => {
    const result = run(target, ref);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(message);
    expect(readFileSync(output, 'utf8')).toBe('');
  });
});
