import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { PersistedAppData, ServerStateSnapshot } from "@/lib/types";
import { getDatabase, hasDatabaseConfig } from "@/lib/server/database";

async function ensureTable() {
  const sql = getDatabase();
  if (!sql) return null;

  await sql`
    create table if not exists app_state (
      id text primary key,
      state jsonb not null,
      revision integer not null default 0,
      updated_at timestamptz not null default timezone('utc', now())
    )
  `;

  await sql`
    alter table app_state
    add column if not exists revision integer not null default 0
  `;

  return sql;
}

async function ensureDefaultRow() {
  const sql = await ensureTable();
  if (!sql) return null;

  const initial = createEmptyAppData();
  const payload = JSON.stringify(initial);

  await sql`
    insert into app_state (id, state, revision, updated_at)
    values ('default', ${payload}::jsonb, 0, timezone('utc', now()))
    on conflict (id)
    do nothing
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

export async function loadAppState(): Promise<ServerStateSnapshot> {
  const sql = await ensureDefaultRow();
  if (!sql) {
    return {
      data: createEmptyAppData(),
      revision: 0,
    };
  }

  const rows = await sql<{ state: PersistedAppData; revision: number }[]>`
    select state, revision
    from app_state
    where id = 'default'
    limit 1
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

export async function saveAppState(state: PersistedAppData, expectedRevision: number) {
  const sql = await ensureDefaultRow();
  if (!sql) {
    throw new Error("DATABASE_URL is missing.");
  }

  const normalized = normalizePersistedAppData(state);
  const payload = JSON.stringify(normalized);

  const rows = await sql<{ revision: number }[]>`
    update app_state
    set
      state = ${payload}::jsonb,
      revision = revision + 1,
      updated_at = timezone('utc', now())
    where id = 'default'
      and revision = ${expectedRevision}
    returning revision
  `;

  if (rows.length === 0) {
    throw new AppStateConflictError(await loadAppState());
  }

  return {
    data: normalized,
    revision: rows[0].revision,
  };
}
