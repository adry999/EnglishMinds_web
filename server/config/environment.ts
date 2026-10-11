export type Environment = Readonly<{ port: number }>;

export function readEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  const raw = env.PORT ?? '3000';
  const port = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT invalid: "${raw}"`);
  }
  return Object.freeze({ port });
}
