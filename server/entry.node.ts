import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { readEnvironment } from './config/environment';
import { clientIpOf } from './client-ip';
import { createRequestHandler } from './handle-request';
import { hashIp } from './leads/ip-hash';
import { consoleLogger, systemClock } from './leads/ports';

function toWebRequest(req: IncomingMessage): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const init: RequestInit & { duplex: 'half' } = {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream<Uint8Array>) : undefined,
    duplex: 'half',
  };
  return new Request(new URL(req.url ?? '/', 'http://localhost'), init);
}

async function sendWebResponse(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

const env = readEnvironment();
// Temporary adapters until the MySQL and SMTP adapters land.
const unavailable = (): Promise<never> => Promise.reject(new Error('storage not configured yet'));
const handle = createRequestHandler({
  repository: { save: unavailable, deleteCreatedBefore: unavailable },
  rateLimiter: { hit: unavailable, deleteWindowsBefore: unavailable },
  notifier: { notify: unavailable },
  clock: systemClock,
  logger: consoleLogger,
  hashIp: (ip) => hashIp(ip, env.ipHashSalt),
});

createServer((req, res) => {
  Promise.resolve()
    .then(() =>
      handle(toWebRequest(req), {
        clientIp: clientIpOf(req.headers['x-forwarded-for'], req.socket.remoteAddress, env.trustProxy),
      }),
    )
    .then((response) => sendWebResponse(response, res))
    .catch((error: unknown) => {
      console.error('[server] unhandled request error', { method: req.method, url: req.url, error });
      if (res.headersSent) {
        res.end();
        return;
      }
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'internal' }));
    });
}).listen(env.port, () => {
  console.log(`[server] listening on ${env.port}`);
});
