export type TagSink = 'gtag' | 'fbq';

export type TagCall = {
  readonly sink: TagSink;
  readonly args: readonly unknown[];
};
