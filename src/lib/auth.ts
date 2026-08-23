import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret(): string {
  return `e-invite-session:${process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSCODE || ""}`;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export function makeSessionToken(): string {
  const expiresAt = Date.now() + TTL_MS;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature) return false;
  const expected = sign(expiry);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(expiry) > Date.now();
}

export function passcodeMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSCODE ?? "";
  if (!expected) return false;
  const a = Buffer.from(input.trim());
  const b = Buffer.from(expected.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  };
}

export { COOKIE_NAME };

export function ipFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
