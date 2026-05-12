import { NextResponse } from "next/server";
import { getSessionCookieName, getSessionCookieOptions } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });

  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
