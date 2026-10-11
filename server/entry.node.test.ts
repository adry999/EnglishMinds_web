import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { connect } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const port = 39000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
let dir: string;
let child: ChildProcess;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'em-server-'));
  const outfile = join(dir, 'app.cjs');
  execFileSync(process.execPath, ['scripts/build-server.mjs', '--outfile', outfile], { stdio: 'inherit' });
  child = spawn(process.execPath, [outfile], { env: { ...process.env, PORT: String(port) } });
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
    expect(await response.json()).toEqual({ ok: true, policyVersion: '1' });
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
    const health = await fetch(`${base}/api/health`);
    expect(health.status).toBe(200);
  });
});
