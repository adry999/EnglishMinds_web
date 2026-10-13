import { createTransport } from 'nodemailer';
import type { Environment } from '../config/environment';
import { SOURCE_LABELS, formatReceivedAt } from './lead-labels';
import type { LeadNotifier, LeadRecord } from './ports';

export type MailSender = {
  sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
};

const dash = (value: string | null): string => value ?? '—';

export function formatLeadEmail(record: LeadRecord): { subject: string; text: string } {
  const { source, medium, campaign } = record.utm;
  const utm = source || medium || campaign ? `${dash(source)} / ${dash(medium)} / ${dash(campaign)}` : '—';
  const lines = [
    `Părinte: ${record.parentName}`,
    `Telefon: ${record.phone}`,
    `Vârsta copilului: ${dash(record.childAgeGroup)}`,
    ...(record.source === 'test' ? [`Rezultat test: ${dash(record.testLevel)}`] : []),
    `Sursă: ${SOURCE_LABELS[record.source]}`,
    `UTM: ${utm}`,
    `Primită: ${formatReceivedAt(record.createdAt, { withYear: true })}`,
    `Acord: politica v${record.policyVersion}`,
    '',
    'Datele se șterg automat după 12 luni.',
  ];
  return { subject: `Cerere nouă de lecție demo – ${SOURCE_LABELS[record.source]}`, text: lines.join('\n') };
}

export function createSmtpNotifier(env: Pick<Environment, 'smtp' | 'mail'>, sender?: MailSender): LeadNotifier {
  const transport: MailSender =
    sender ??
    createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      requireTLS: env.smtp.port !== 465,
      auth: { user: env.smtp.user, pass: env.smtp.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  return {
    async notify(record) {
      await transport.sendMail({ from: env.mail.from, to: env.mail.to, ...formatLeadEmail(record) });
    },
  };
}
