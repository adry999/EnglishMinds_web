export type Environment = Readonly<{
  port: number;
  db: Readonly<{ host: string; port: number; user: string; password: string; database: string }>;
  smtp: Readonly<{ host: string; port: number; user: string; password: string }>;
  mail: Readonly<{ from: string; to: string }>;
  ipHashSalt: string;
  trustProxyHops: number;
  globalHourlyCap: number;
  telegram: Readonly<{ botToken: string; chatId: string }> | null;
  debugClientIp: boolean;
}>;

export class ConfigError extends Error {
  constructor(
    message: string,
    readonly variable: string,
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim() ?? '';
  if (value === '') throw new ConfigError(`Missing environment variable: ${name}`, name);
  return value;
}

function portOf(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name] ?? String(fallback);
  const port = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`${name} invalid: "${raw}"`, name);
  }
  return port;
}

function emailOf(env: NodeJS.ProcessEnv, name: string): string {
  const value = required(env, name);
  if (!EMAIL.test(value)) throw new ConfigError(`${name} invalid: "${value}"`, name);
  return value;
}

function flagOf(env: NodeJS.ProcessEnv, name: string): boolean {
  const raw = env[name]?.trim() ?? '';
  if (raw === '' || raw === 'false') return false;
  if (raw === 'true') return true;
  throw new ConfigError(`${name} invalid: "${raw}"`, name);
}

function integerOf(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name]?.trim() ?? '';
  if (raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw new ConfigError(`${name} invalid: "${raw}"`, name);
  return value;
}

function invalidSecret(name: string): ConfigError {
  return new ConfigError(`${name} invalid`, name);
}

function telegramOf(env: NodeJS.ProcessEnv): Environment['telegram'] {
  const botToken = env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
  const chatId = env.TELEGRAM_CHAT_ID?.trim() ?? '';
  if (botToken === '' && chatId === '') return null;
  if (botToken === '') throw new ConfigError('Missing environment variable: TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN');
  if (chatId === '') throw new ConfigError('Missing environment variable: TELEGRAM_CHAT_ID', 'TELEGRAM_CHAT_ID');
  if (!/^\d+:[\w-]+$/.test(botToken)) throw invalidSecret('TELEGRAM_BOT_TOKEN');
  if (!/^-?\d+$|^@\w+$/.test(chatId)) throw invalidSecret('TELEGRAM_CHAT_ID');
  return Object.freeze({ botToken, chatId });
}

export function readEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  const ipHashSalt = required(env, 'IP_HASH_SALT');
  if (ipHashSalt.length < 32) throw new ConfigError('IP_HASH_SALT must have at least 32 characters', 'IP_HASH_SALT');
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
    trustProxyHops: integerOf(env, 'TRUST_PROXY_HOPS', 0, 0, 10),
    globalHourlyCap: integerOf(env, 'LEAD_GLOBAL_HOURLY_CAP', 60, 1, 10_000),
    telegram: telegramOf(env),
    debugClientIp: flagOf(env, 'DEBUG_CLIENT_IP'),
  });
}
