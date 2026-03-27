import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { PersistedAppData } from "@/lib/types";
import { getDatabase, hasDatabaseConfig } from "@/lib/server/database";

async function ensureTable() {
  const sql = getDatabase();
  if (!sql) return null;

  await sql`
    create table if not exists app_state (
      id text primary key,
      state jsonb not null,
      updated_at timestamptz not null default timezone('utc', now())
    )
  `;

  return sql;
}

export function backendConfigured() {
  return hasDatabaseConfig();
}

export async function loadAppState(): Promise<PersistedAppData> {
  const sql = await ensureTable();
  if (!sql) {
    return createEmptyAppData();
  }

  const rows = await sql<{ state: PersistedAppData }[]>`
    select state
    from app_state
    where id = 'default'
    limit 1
  `;

  if (rows.length === 0) {
    const initial = createEmptyAppData();
    await saveAppState(initial);
    return initial;
  }

  return normalizePersistedAppData(rows[0].state);
}

export async function saveAppState(state: PersistedAppData) {
  const sql = await ensureTable();
  if (!sql) {
    throw new Error("DATABASE_URL is missing.");
  }

  const normalized = normalizePersistedAppData(state);
  const payload = JSON.stringify(normalized);

  await sql`
    insert into app_state (id, state, updated_at)
    values ('default', ${payload}::jsonb, timezone('utc', now()))
    on conflict (id)
    do update set
      state = excluded.state,
      updated_at = timezone('utc', now())
  `;

  return normalized;
}
