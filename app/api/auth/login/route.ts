import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/server/users";
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

  try {
    const userId = await verifyUser(email, password);

    if (!userId) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ authenticated: true, userId });

    response.cookies.set(
      getSessionCookieName(),
      createSessionCookieValue(userId),
      getSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion. Réessayez." },
      { status: 500 },
    );
  }
}
