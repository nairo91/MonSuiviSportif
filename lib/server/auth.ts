import crypto from "crypto";

const SESSION_COOKIE_NAME = "irontrack-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getAccessCode() {
  const value = process.env.APP_ACCESS_CODE?.trim();
  return value ? value : null;
}

function getSessionSecret() {
  const explicitSecret = process.env.SESSION_SECRET?.trim();
  return explicitSecret || getAccessCode();
}

function signSessionPayload(payload: string) {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function authConfigured() {
  return Boolean(getAccessCode() && getSessionSecret());
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

export function createSessionCookieValue() {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = signSessionPayload(payload);

  if (!signature) {
    throw new Error("SESSION_SECRET is missing.");
  }

  return `${payload}.${signature}`;
}

export function validateSessionCookie(value?: string | null) {
  if (!value) {
    return false;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = signSessionPayload(payload);
  if (!expectedSignature || !safeCompare(signature, expectedSignature)) {
    return false;
  }

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  return true;
}

export function verifyAccessCode(input: string) {
  const expected = getAccessCode();
  if (!expected) {
    return false;
  }

  return safeCompare(input.trim(), expected);
}
