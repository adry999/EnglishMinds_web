// @vitest-environment happy-dom
// @vitest-environment-options { "settings": { "disableJavaScriptFileLoading": true, "handleDisabledFileLoadingAsSuccess": true } }
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appendScript, ensureFbq, sendTagCalls, type TrackingWindow } from './track';

afterEach(() => {
  document.head.innerHTML = '';
});

describe('sendTagCalls', () => {
  it('calls each sink with its arguments, in order', () => {
    const order: string[] = [];
    const target: TrackingWindow = {
      gtag: vi.fn((...args: unknown[]) => order.push(`gtag:${String(args[0])}`)),
      fbq: vi.fn((...args: unknown[]) => order.push(`fbq:${String(args[0])}`)),
    };
    sendTagCalls(target, [
      { sink: 'gtag', args: ['consent', 'update', {}] },
      { sink: 'fbq', args: ['init', '1'] },
      { sink: 'gtag', args: ['config', 'G-X'] },
    ]);
    expect(order).toEqual(['gtag:consent', 'fbq:init', 'gtag:config']);
    expect(target.fbq).toHaveBeenCalledWith('init', '1');
  });

  it('skips a sink that is missing, e.g. blocked by an ad blocker', () => {
    expect(() => sendTagCalls({}, [{ sink: 'fbq', args: ['track', 'Lead'] }])).not.toThrow();
  });
});

describe('ensureFbq', () => {
  it('installs a queueing stub like the official Meta snippet', () => {
    const target: TrackingWindow = {};
    ensureFbq(target);
    target.fbq?.('init', '123');
    const stub = target.fbq as unknown as { queue: unknown[][]; loaded: boolean; version: string };
    expect(stub.queue).toEqual([['init', '123']]);
    expect(stub.loaded).toBe(true);
    expect(stub.version).toBe('2.0');
    expect(target._fbq).toBe(target.fbq);
  });

  it('queues through push like the official snippet, and sets _fbq only with the stub', () => {
    const target: TrackingWindow = {};
    expect(target._fbq).toBeUndefined();
    ensureFbq(target);
    target.fbq?.('track', 'PageView');
    (target.fbq as unknown as { push: (...args: unknown[]) => void }).push('track', 'Lead');
    expect((target.fbq as unknown as { queue: unknown[][] }).queue).toEqual([
      ['track', 'PageView'],
      ['track', 'Lead'],
    ]);
  });

  it('hands calls to callMethod once the real library replaces it, instead of queueing', () => {
    const target: TrackingWindow = {};
    ensureFbq(target);
    const stub = target.fbq as unknown as { queue: unknown[][]; callMethod?: ReturnType<typeof vi.fn>; push: (...a: unknown[]) => void };
    stub.callMethod = vi.fn();
    target.fbq?.('init', '1');
    stub.push('track', 'Lead');
    expect(stub.callMethod).toHaveBeenNthCalledWith(1, 'init', '1');
    expect(stub.callMethod).toHaveBeenNthCalledWith(2, 'track', 'Lead');
    expect(stub.queue).toEqual([]);
  });

  it('keeps an existing fbq', () => {
    const existing = vi.fn();
    const target: TrackingWindow = { fbq: existing };
    ensureFbq(target);
    expect(target.fbq).toBe(existing);
  });
});

describe('appendScript', () => {
  it('adds one async script to head and never duplicates it', () => {
    appendScript(document, 'https://example.test/a.js');
    appendScript(document, 'https://example.test/a.js');
    const scripts = document.head.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.getAttribute('src')).toBe('https://example.test/a.js');
    expect(scripts[0]?.async).toBe(true);
  });
});
