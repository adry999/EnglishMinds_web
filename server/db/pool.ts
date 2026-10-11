import { createPool, type Pool } from 'mysql2/promise';
import type { Environment } from '../config/environment';

export function createDatabasePool(db: Environment['db']): Pool {
  return createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    timezone: 'Z',
    connectionLimit: 5,
    connectTimeout: 10_000,
    waitForConnections: true,
  });
}
