export type Environment = Readonly<{
  port: number;
  db: Readonly<{ host: string; port: number; user: string; password: string; database: string }>;
  smtp: Readonly<{ host: string; port: number; user: string; password: string }>;
  mail: Readonly<{ from: string; to: string }>;
  ipHashSalt: string;
  trustProxy: boolean;
}>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim() ?? '';
  if (value === '') throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function portOf(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name] ?? String(fallback);
  const port = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} invalid: "${raw}"`);
  }
  return port;
}

function emailOf(env: NodeJS.ProcessEnv, name: string): string {
  const value = required(env, name);
  if (!EMAIL.test(value)) throw new Error(`${name} invalid: "${value}"`);
  return value;
}

function flagOf(env: NodeJS.ProcessEnv, name: string): boolean {
  const raw = env[name]?.trim() ?? '';
  if (raw === '' || raw === 'false') return false;
  if (raw === 'true') return true;
  throw new Error(`${name} invalid: "${raw}"`);
}

export function readEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  const ipHashSalt = required(env, 'IP_HASH_SALT');
  if (ipHashSalt.length < 32) throw new Error('IP_HASH_SALT must have at least 32 characters');
  return Object.freeze({
    port: portOf(env, 'PORT', 3000),
    db: Object.freeze({
      host: required(env, 'DB_HOST'),
      port: portOf(env, 'DB_PORT', 3306),
      user: required(env, 'DB_USER'),
      password: required(env, 'DB_PASSWORD'),
      database: required(env, 'DB_NAME'),
    }),
    smtp: Object.freeze({
      host: required(env, 'SMTP_HOST'),
      port: portOf(env, 'SMTP_PORT', 465),
      user: required(env, 'SMTP_USER'),
      password: required(env, 'SMTP_PASSWORD'),
    }),
    mail: Object.freeze({ from: emailOf(env, 'MAIL_FROM'), to: emailOf(env, 'MAIL_TO') }),
    ipHashSalt,
    trustProxy: flagOf(env, 'TRUST_PROXY'),
  });
}
