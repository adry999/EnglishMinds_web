type TagSink = 'gtag' | 'fbq' | 'dataLayer';

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

function pushDataLayerEvent(target: TrackingWindow, event: unknown): void {
  target.dataLayer ??= [];
  target.dataLayer.push(event);
}

export function sendTagCalls(target: TrackingWindow, calls: readonly TagCall[]): void {
  for (const call of calls) {
    if (call.sink === 'dataLayer') {
      pushDataLayerEvent(target, call.args[0]);
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
  if (doc.querySelector(`script[src="${src}"]`)) return;
  const script = doc.createElement('script');
  script.async = true;
  script.src = src;
  doc.head.append(script);
}
