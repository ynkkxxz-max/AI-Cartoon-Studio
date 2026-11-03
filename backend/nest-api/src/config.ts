import { z } from 'zod';

export const CONFIG = Symbol('CONFIG');
const ownerKeys = z.array(z.object({ ownerId: z.uuid(), token: z.string().min(32).max(256) }).strict()).min(1);
export type Config = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const databaseUrl = z.url().parse(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(new URL(databaseUrl).protocol)) throw new Error('PostgreSQL required');
  let keys: z.infer<typeof ownerKeys>;
  try { keys = ownerKeys.parse(JSON.parse(env.OWNER_API_KEYS ?? '')); }
  catch { throw new Error('OWNER_API_KEYS must contain owner UUIDs and tokens of at least 32 characters'); }
  if (new Set(keys.map(k => k.token)).size !== keys.length) throw new Error('Duplicate API tokens');
  const origins = (env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(o => o.trim());
  for (const origin of origins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error('Use exact HTTP CORS origins');
  }
  return {
    databaseUrl, keys, origins,
    port: z.coerce.number().int().min(1).max(65535).parse(env.PORT ?? 8002),
    rateLimit: z.coerce.number().int().min(1).max(10000).parse(env.RATE_LIMIT ?? 120),
  };
}
