import { describe, expect, it } from 'vitest';
import { FakeNotifier, RecordingLogger, aLead } from '@test-support/lead-fakes';
import { createLeadDispatcher } from './notify-leads';

const record = aLead();

describe('createLeadDispatcher', () => {
  it('sends through every channel and reports success', async () => {
    const email = new FakeNotifier();
    const telegram = new FakeNotifier();
    const dispatcher = createLeadDispatcher([{ name: 'email', notifier: email }, { name: 'telegram', notifier: telegram }], new RecordingLogger());
    await expect(dispatcher.dispatch(record)).resolves.toBe(true);
    expect(email.sent).toEqual([record]);
    expect(telegram.sent).toEqual([record]);
  });

  it('still delivers through Telegram when email fails, and the other way round', async () => {
    const logger = new RecordingLogger();
    const email = new FakeNotifier();
    email.failWith = Object.assign(new Error('SMTP down for Ana Pop'), { responseCode: 421 });
    const telegram = new FakeNotifier();
    const dispatcher = createLeadDispatcher([{ name: 'email', notifier: email }, { name: 'telegram', notifier: telegram }], logger);
    await expect(dispatcher.dispatch(record)).resolves.toBe(true);
    expect(telegram.sent).toHaveLength(1);
    expect(JSON.stringify(logger.entries)).toContain('email notification failed');
    expect(JSON.stringify(logger.entries)).not.toContain('Ana Pop');

    email.failWith = null;
    telegram.failWith = new Error('x');
    await expect(dispatcher.dispatch(record)).resolves.toBe(true);
    expect(email.sent).toHaveLength(1);
  });

  it('reports failure when every channel fails, without throwing', async () => {
    const email = new FakeNotifier();
    email.failWith = new Error('down');
    const telegram = new FakeNotifier();
    telegram.failWith = new Error('down');
    const dispatcher = createLeadDispatcher([{ name: 'email', notifier: email }, { name: 'telegram', notifier: telegram }], new RecordingLogger());
    await expect(dispatcher.dispatch(record)).resolves.toBe(false);
  });
});
