import crypto from "crypto";

const SESSION_COOKIE_NAME = "irontrack-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  return "irontrack-dev-secret-insecure";
}

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function createSessionCookieValue(userId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${userId}~${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function getUserIdFromSession(value?: string | null): string | null {
  if (!value) return null;

  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = value.slice(0, lastDot);
  const signature = value.slice(lastDot + 1);

  const expectedSignature = signPayload(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return null;
  }

  const tildeIdx = payload.lastIndexOf("~");
  if (tildeIdx === -1) return null;

  const userId = payload.slice(0, tildeIdx);
  const expiresAt = Number(payload.slice(tildeIdx + 1));

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  if (!userId) return null;

  return userId;
}

export function validateSessionCookie(value?: string | null): boolean {
  return getUserIdFromSession(value) !== null;
}
