import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { RateLimiter } from './ports';

export const RATE_LIMIT_PER_HOUR = 5;

/** Key of the site-wide counter, stored in the same table as the per-visitor hashes. */
export const GLOBAL_RATE_KEY = 'global';

export function windowStart(now: Date): Date {
  const start = new Date(now.getTime());
  start.setUTCMinutes(0, 0, 0);
  return start;
}

export function createMysqlRateLimiter(pool: Pool, limit = RATE_LIMIT_PER_HOUR): RateLimiter {
  return {
    async hit(key, now, limitOverride = limit) {
      const start = windowStart(now);
      await pool.execute(
        'INSERT INTO rate_limits (ip_hash, window_start, hits) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE hits = hits + 1',
        [key, start],
      );
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT hits FROM rate_limits WHERE ip_hash = ? AND window_start = ?', [key, start]);
      return Number(rows[0]?.hits ?? 0) <= limitOverride;
    },
    async deleteWindowsBefore(cutoff) {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM rate_limits WHERE window_start < ?', [cutoff]);
      return result.affectedRows;
    },
  };
}
