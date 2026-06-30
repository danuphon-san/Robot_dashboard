import { Pool, type PoolConfig } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __dashboardPool: Pool | undefined;
}

function readUrlConfig(): PoolConfig | null {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;

  const url = new URL(raw);
  const hasPassword = url.password.length > 0;
  const isLocalTcpHost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1";

  // If a local URL has no password, prefer the Postgres Unix socket so peer auth works.
  if (isLocalTcpHost && !hasPassword) {
    return {
      host: process.env.PGHOST || "/var/run/postgresql",
      port: Number(process.env.PGPORT || url.port || 5432),
      database: process.env.PGDATABASE || decodeURIComponent(url.pathname.replace(/^\//, "")) || "danuphon",
      user: process.env.PGUSER || decodeURIComponent(url.username) || "danuphon",
      max: 10,
      idleTimeoutMillis: 30000
    };
  }

  return {
    connectionString: raw,
    max: 10,
    idleTimeoutMillis: 30000
  };
}

function readFallbackConfig(): PoolConfig {
  return {
    host: process.env.PGHOST || "/var/run/postgresql",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "danuphon",
    user: process.env.PGUSER || "danuphon",
    password:
      typeof process.env.PGPASSWORD === "string" ? process.env.PGPASSWORD : undefined,
    max: 10,
    idleTimeoutMillis: 30000
  };
}

const poolConfig = readUrlConfig() ?? readFallbackConfig();

export const pool =
  global.__dashboardPool ??
  new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  global.__dashboardPool = pool;
}
