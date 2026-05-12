import { NextRequest, NextResponse } from "next/server";
import {
  getSessionCookieName,
  getSessionCookieOptions,
  getUserIdFromSession,
} from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = getUserIdFromSession(request.cookies.get(getSessionCookieName())?.value);

  return NextResponse.json({
    authenticated: userId !== null,
    userId: userId ?? null,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });

  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
