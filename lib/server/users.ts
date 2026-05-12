import bcrypt from "bcryptjs";
import { getDatabase } from "./database";
import { uid } from "@/lib/utils";

async function ensureTable() {
  const sql = getDatabase();
  if (!sql) throw new Error("DATABASE_URL est requis pour l'authentification.");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  return sql;
}

export async function createUser(email: string, password: string): Promise<string> {
  const sql = await ensureTable();
  const id = uid("user");
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await sql`
      INSERT INTO users (id, email, password_hash)
      VALUES (${id}, ${email.toLowerCase().trim()}, ${passwordHash})
    `;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "23505") {
      throw new Error("Un compte avec cet email existe déjà.");
    }
    throw error;
  }

  return id;
}

export async function verifyUser(email: string, password: string): Promise<string | null> {
  const sql = await ensureTable();

  const rows = await sql<{ id: string; password_hash: string }[]>`
    SELECT id, password_hash
    FROM users
    WHERE email = ${email.toLowerCase().trim()}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const match = await bcrypt.compare(password, rows[0].password_hash);
  return match ? rows[0].id : null;
}

export async function getUserById(userId: string): Promise<{ id: string; email: string } | null> {
  const sql = await ensureTable();

  const rows = await sql<{ id: string; email: string }[]>`
    SELECT id, email
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows.length > 0 ? rows[0] : null;
}
