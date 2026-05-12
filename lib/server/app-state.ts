import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { PersistedAppData, ServerStateSnapshot } from "@/lib/types";
import { getDatabase, hasDatabaseConfig } from "@/lib/server/database";

async function ensureTable() {
  const sql = getDatabase();
  if (!sql) return null;

  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      state JSONB NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS app_state_user_id_idx ON app_state (user_id)
  `;

  return sql;
}

async function ensureUserRow(userId: string) {
  const sql = await ensureTable();
  if (!sql) return null;

  const initial = createEmptyAppData();
  const payload = JSON.stringify(initial);

  await sql`
    INSERT INTO app_state (id, user_id, state, revision, updated_at)
    VALUES (${userId}, ${userId}, ${payload}::jsonb, 0, TIMEZONE('utc', NOW()))
    ON CONFLICT (user_id)
    DO NOTHING
  `;

  return sql;
}

export function backendConfigured() {
  return hasDatabaseConfig();
}

export class AppStateConflictError extends Error {
  latest: ServerStateSnapshot;

  constructor(latest: ServerStateSnapshot) {
    super("App state conflict");
    this.latest = latest;
  }
}

export async function loadAppState(userId: string): Promise<ServerStateSnapshot> {
  const sql = await ensureUserRow(userId);
  if (!sql) {
    return {
      data: createEmptyAppData(),
      revision: 0,
    };
  }

  const rows = await sql<{ state: PersistedAppData; revision: number }[]>`
    SELECT state, revision
    FROM app_state
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return {
      data: createEmptyAppData(),
      revision: 0,
    };
  }

  return {
    data: normalizePersistedAppData(rows[0].state),
    revision: rows[0].revision,
  };
}

export async function saveAppState(
  state: PersistedAppData,
  userId: string,
  expectedRevision: number,
) {
  const sql = await ensureUserRow(userId);
  if (!sql) {
    throw new Error("DATABASE_URL est requis pour sauvegarder les données.");
  }

  const normalized = normalizePersistedAppData(state);
  const payload = JSON.stringify(normalized);

  const rows = await sql<{ revision: number }[]>`
    UPDATE app_state
    SET
      state = ${payload}::jsonb,
      revision = revision + 1,
      updated_at = TIMEZONE('utc', NOW())
    WHERE user_id = ${userId}
      AND revision = ${expectedRevision}
    RETURNING revision
  `;

  if (rows.length === 0) {
    throw new AppStateConflictError(await loadAppState(userId));
  }

  return {
    data: normalized,
    revision: rows[0].revision,
  };
}
