import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/server/users";
import {
  createSessionCookieValue,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/server/auth";
import { hasDatabaseConfig } from "@/lib/server/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { error: "DATABASE_URL doit être configuré côté serveur." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Adresse email invalide." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }

  try {
    const userId = await createUser(email, password);
    const response = NextResponse.json({ authenticated: true, userId });

    response.cookies.set(
      getSessionCookieName(),
      createSessionCookieValue(userId),
      getSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la création du compte.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
