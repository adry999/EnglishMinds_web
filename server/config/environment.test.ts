import { describe, expect, it } from 'vitest';
import { readEnvironment } from './environment';

const BASE = {
  PORT: '8080',
  DB_HOST: 'localhost',
  DB_USER: 'em_user',
  DB_PASSWORD: 'secret',
  DB_NAME: 'em_site',
  SMTP_HOST: 'mail.example.ro',
  SMTP_USER: 'site@example.ro',
  SMTP_PASSWORD: 'mail-secret',
  MAIL_FROM: 'site@example.ro',
  MAIL_TO: 'office@example.ro',
  IP_HASH_SALT: 's'.repeat(32),
};

describe('readEnvironment', () => {
  it('reads a complete configuration with defaults', () => {
    expect(readEnvironment(BASE)).toEqual({
      port: 8080,
      db: { host: 'localhost', port: 3306, user: 'em_user', password: 'secret', database: 'em_site' },
      smtp: { host: 'mail.example.ro', port: 465, user: 'site@example.ro', password: 'mail-secret' },
      mail: { from: 'site@example.ro', to: 'office@example.ro' },
      ipHashSalt: 's'.repeat(32),
      trustProxy: false,
    });
  });

  it('defaults PORT to 3000', () => {
    expect(readEnvironment({ ...BASE, PORT: undefined }).port).toBe(3000);
  });

  it('reads optional ports and the proxy flag', () => {
    const env = readEnvironment({ ...BASE, DB_PORT: '3307', SMTP_PORT: '587', TRUST_PROXY: 'true' });
    expect(env.db.port).toBe(3307);
    expect(env.smtp.port).toBe(587);
    expect(env.trustProxy).toBe(true);
  });

  it.each(['abc', '0', '70000', '80.5', ''])('rejects PORT=%j with a clear message', (value) => {
    expect(() => readEnvironment({ ...BASE, PORT: value })).toThrow(`PORT invalid: "${value}"`);
  });

  it('rejects an invalid DB_PORT', () => {
    expect(() => readEnvironment({ ...BASE, DB_PORT: 'x' })).toThrow('DB_PORT invalid: "x"');
  });

  it.each(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM', 'MAIL_TO', 'IP_HASH_SALT'])(
    'requires %s',
    (name) => {
      expect(() => readEnvironment({ ...BASE, [name]: '  ' })).toThrow(`Missing environment variable: ${name}`);
    },
  );

  it('requires a salt of at least 32 characters', () => {
    expect(() => readEnvironment({ ...BASE, IP_HASH_SALT: 'short' })).toThrow('IP_HASH_SALT must have at least 32 characters');
  });

  it.each(['MAIL_FROM', 'MAIL_TO'])('requires an email address in %s', (name) => {
    expect(() => readEnvironment({ ...BASE, [name]: 'office' })).toThrow(`${name} invalid: "office"`);
  });

  it('rejects an unknown TRUST_PROXY value', () => {
    expect(() => readEnvironment({ ...BASE, TRUST_PROXY: 'yes' })).toThrow('TRUST_PROXY invalid: "yes"');
  });

  it('returns a deeply frozen object', () => {
    const env = readEnvironment(BASE);
    expect(Object.isFrozen(env)).toBe(true);
    expect(Object.isFrozen(env.db)).toBe(true);
    expect(Object.isFrozen(env.smtp)).toBe(true);
    expect(Object.isFrozen(env.mail)).toBe(true);
  });
});
