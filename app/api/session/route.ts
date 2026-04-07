import { NextRequest, NextResponse } from "next/server";
import {
  authConfigured,
  createSessionCookieValue,
  getSessionCookieName,
  getSessionCookieOptions,
  validateSessionCookie,
  verifyAccessCode,
} from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated:
      authConfigured() &&
      validateSessionCookie(request.cookies.get(getSessionCookieName())?.value),
    configured: authConfigured(),
  });
}

export async function POST(request: NextRequest) {
  if (!authConfigured()) {
    return NextResponse.json(
      {
        error: "APP_ACCESS_CODE doit etre configure cote serveur.",
        configured: false,
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const accessCode = typeof body?.accessCode === "string" ? body.accessCode : "";

  if (!verifyAccessCode(accessCode)) {
    return NextResponse.json(
      {
        error: "Code d'acces invalide.",
        configured: true,
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    configured: true,
  });

  response.cookies.set(
    getSessionCookieName(),
    createSessionCookieValue(),
    getSessionCookieOptions(),
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({
    authenticated: false,
    configured: authConfigured(),
  });

  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
