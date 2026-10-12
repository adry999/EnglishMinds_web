import type { Environment } from '../config/environment';
import { createSmtpNotifier } from './lead-notification';
import type { NotificationChannel } from './ports';
import { createTelegramNotifier } from './telegram-notification';

export function createChannels(env: Pick<Environment, 'smtp' | 'mail' | 'telegram'>): NotificationChannel[] {
  const channels: NotificationChannel[] = [{ name: 'email', notifier: createSmtpNotifier(env) }];
  if (env.telegram) channels.push({ name: 'telegram', notifier: createTelegramNotifier(env.telegram) });
  return channels;
}
