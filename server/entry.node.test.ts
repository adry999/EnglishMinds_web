import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { connect } from 'node:net';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { aLeadSubmission } from '@test-support/lead-fakes';

const TEST_ENV = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1',
  SMTP_USER: 'test',
  SMTP_PASSWORD: 'test',
  MAIL_FROM: 'site@example.test',
  MAIL_TO: 'office@example.test',
  IP_HASH_SALT: 'x'.repeat(32),
};

const port = 39000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
let dir: string;
let child: ChildProcess;
let stderr = '';

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'em-server-'));
  const outfile = join(dir, 'app.cjs');
  execFileSync(process.execPath, ['scripts/build-server.mjs', '--outdir', dir], { stdio: 'inherit' });
  child = spawn(process.execPath, [outfile], { env: { ...process.env, ...TEST_ENV, PORT: String(port) } });
  child.stderr?.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
  await new Promise<void>((resolve, reject) => {
    child.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('listening')) resolve();
    });
    child.once('exit', (code) => reject(new Error(`server exited early with code ${code}`)));
  });
}, 30_000);

afterAll(() => {
  child?.kill();
  rmSync(dir, { recursive: true, force: true });
});

describe('server bundle', () => {
  it('serves /api/health', async () => {
    const response = await fetch(`${base}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, policyVersion: '2' });
  });

  it('answers an unknown POST with a JSON 404 without hanging', async () => {
    const response = await fetch(`${base}/api/nope`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'ăîșț' }),
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: 'not_found' });
  });

  it('answers HEAD /api/health with 200', async () => {
    const response = await fetch(`${base}/api/health`, { method: 'HEAD' });
    expect(response.status).toBe(200);
  });

  it('answers an unparsable request target with 500 and keeps serving', async () => {
    const raw = await new Promise<string>((resolve, reject) => {
      const socket = connect(port, '127.0.0.1', () => {
        socket.write('GET // HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
      });
      let data = '';
      socket.on('data', (chunk) => (data += chunk.toString()));
      socket.on('end', () => resolve(data));
      socket.on('error', reject);
    });
    expect(raw.startsWith('HTTP/1.1 500')).toBe(true);
    await vi.waitFor(() => expect(stderr).toContain('unhandled request error'));
    expect(stderr).toContain('path: null');
    expect(stderr).not.toContain('http://localhost');
    const health = await fetch(`${base}/api/health`);
    expect(health.status).toBe(200);
  });

  it('answers a valid lead with a generic 500 when the database is unreachable', async () => {
    const response = await fetch(`${base}/api/lead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(aLeadSubmission()),
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: 'internal' });
  });

  it('answers a honeypot submission with 201 without touching the database', async () => {
    const response = await fetch(`${base}/api/lead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ website: 'spam', elapsedMs: 9000 }),
    });
    expect(response.status).toBe(201);
  });

  it('bundles the purge and the notification retry jobs', () => {
    expect(existsSync(join(dir, 'purge-expired-leads.cjs'))).toBe(true);
    expect(existsSync(join(dir, 'notify-pending-leads.cjs'))).toBe(true);
  });

  it('exits on a bad configuration without printing any variable value', async () => {
    const secret = 'super-secret-db-password';
    const result = await new Promise<{ code: number | null; output: string }>((resolve) => {
      const bad = spawn(process.execPath, [join(dir, 'app.cjs')], {
        env: { ...process.env, ...TEST_ENV, DB_PASSWORD: secret, IP_HASH_SALT: 'too-short' },
      });
      let output = '';
      bad.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
      bad.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));
      bad.once('exit', (code) => resolve({ code, output }));
    });
    expect(result.code).toBe(1);
    expect(result.output).toContain('cannot start');
    expect(result.output).toContain('IP_HASH_SALT');
    expect(result.output).not.toContain(secret);
    expect(result.output).not.toContain('too-short');
    expect(result.output).not.toMatch(/\n\s+at /);
  });
});
