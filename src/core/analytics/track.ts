export type TagSink = 'gtag' | 'fbq' | 'dataLayer';

export type TagCall = {
  readonly sink: TagSink;
  readonly args: readonly unknown[];
};

type TagFunction = (...args: unknown[]) => void;

export type TrackingWindow = {
  dataLayer?: unknown[];
  gtag?: TagFunction;
  fbq?: TagFunction;
  _fbq?: TagFunction;
};

type FbqStub = TagFunction & {
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: TagFunction;
  callMethod?: TagFunction;
};

/** Runs calls already filtered by consent; a missing sink (ad blocker) is skipped. */
export function sendTagCalls(target: TrackingWindow, calls: readonly TagCall[]): void {
  for (const call of calls) {
    if (call.sink === 'dataLayer') {
      // Plain objects (not `arguments`): these are GTM events and variables, not gtag commands.
      target.dataLayer = target.dataLayer ?? [];
      target.dataLayer.push(call.args[0]);
      continue;
    }
    const fn = target[call.sink];
    if (typeof fn === 'function') fn(...call.args);
  }
}

export function ensureFbq(target: TrackingWindow): void {
  if (typeof target.fbq === 'function') return;
  const stub = ((...args: unknown[]) => {
    if (stub.callMethod) stub.callMethod(...args);
    else stub.queue.push(args);
  }) as FbqStub;
  stub.queue = [];
  stub.loaded = true;
  stub.version = '2.0';
  stub.push = stub;
  target.fbq = stub;
  target._fbq = stub;
}

export function appendScript(doc: Document, src: string): void {
  if (Array.from(doc.scripts).some((script) => script.getAttribute('src') === src)) return;
  const script = doc.createElement('script');
  script.async = true;
  script.src = src;
  doc.head.append(script);
}
