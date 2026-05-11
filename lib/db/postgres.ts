import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

/**
 * Direct PostgreSQL connection (bypasses Supabase REST/PostgREST).
 * Reads connection string from DATABASE_URL.
 * Use only for cases where the Supabase JS client misbehaves.
 */
export function getSql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  _sql = postgres(url, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return _sql;
}
