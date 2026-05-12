import postgres from "postgres";

let client: postgres.Sql | null = null;

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL);
}

// postgres.js v3 does not support SCRAM-SHA-256-PLUS (channel binding).
// Strip channel_binding from the URL so Neon falls back to SCRAM-SHA-256
// while SSL security is still enforced via the ssl option below.
function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getDatabase() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!client) {
    client = postgres(sanitizeDatabaseUrl(process.env.DATABASE_URL), {
      ssl: "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }

  return client;
}
