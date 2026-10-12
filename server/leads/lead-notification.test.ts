import { describe, expect, it, vi } from 'vitest';
import { createSmtpNotifier, formatLeadEmail, type MailSender } from './lead-notification';
import type { LeadRecord } from './ports';

const record: LeadRecord = {
  parentName: 'Ştefănescu Ana',
  phone: '+40722123456',
  childAgeGroup: '7–8 ani',
  source: 'test',
  testLevel: 'level:movers',
  consent: true,
  policyVersion: '2',
  utm: { source: 'instagram', medium: null, campaign: 'demo-toamna' },
  consentAt: new Date('2026-10-11T09:30:00.000Z'),
  createdAt: new Date('2026-10-11T09:30:00.000Z'),
};

describe('formatLeadEmail', () => {
  it('writes a plain Romanian summary with the Bucharest time', () => {
    const { subject, text } = formatLeadEmail(record);
    expect(subject).toBe('Cerere nouă de lecție demo – testul de nivel');
    expect(text).toContain('Părinte: Ştefănescu Ana');
    expect(text).toContain('Telefon: +40722123456');
    expect(text).toContain('Vârsta copilului: 7–8 ani');
    expect(text).toContain('Rezultat test: level:movers');
    expect(text).toContain('UTM: instagram / — / demo-toamna');
    expect(text).toContain('Primită: 11.10.2026, 12:30');
    expect(text).toContain('Acord: politica v2');
    expect(text).toContain('Datele se șterg automat după 12 luni.');
  });

  it('uses dashes for missing values and omits the test line for other sources', () => {
    const { subject, text } = formatLeadEmail({ ...record, source: 'home', testLevel: null, childAgeGroup: null, utm: { source: null, medium: null, campaign: null } });
    expect(subject).toBe('Cerere nouă de lecție demo – pagina principală');
    expect(text).toContain('Vârsta copilului: —');
    expect(text).toContain('UTM: —');
    expect(text).not.toContain('Rezultat test');
  });

  it('keeps the subject free of personal data', () => {
    expect(formatLeadEmail(record).subject).not.toContain('Ana');
  });
});

describe('createSmtpNotifier', () => {
  it('sends the formatted email from and to the configured addresses', async () => {
    const sendMail = vi.fn<MailSender['sendMail']>().mockResolvedValue({});
    const notifier = createSmtpNotifier(
      { smtp: { host: 'h', port: 465, user: 'u', password: 'p' }, mail: { from: 'site@example.ro', to: 'office@example.ro' } },
      { sendMail },
    );
    await notifier.notify(record);
    expect(sendMail).toHaveBeenCalledWith({ from: 'site@example.ro', to: 'office@example.ro', ...formatLeadEmail(record) });
  });

  it('propagates send failures to the caller', async () => {
    const notifier = createSmtpNotifier(
      { smtp: { host: 'h', port: 465, user: 'u', password: 'p' }, mail: { from: 'a@b.ro', to: 'c@d.ro' } },
      { sendMail: () => Promise.reject(new Error('timeout')) },
    );
    await expect(notifier.notify(record)).rejects.toThrow('timeout');
  });
});
