import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  ipFromHeaders,
  makeSessionToken,
  passcodeMatches,
  sessionCookieOptions,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSCODE) {
    return NextResponse.json(
      { error: "Admin access is not configured. Set ADMIN_PASSCODE in the environment." },
      { status: 503 }
    );
  }

  if (!rateLimit(`admin-login:${ipFromHeaders(request.headers)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in an hour." },
      { status: 429 }
    );
  }

  let body: { passcode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const passcode = typeof body.passcode === "string" ? body.passcode : "";
  if (!passcode || !passcodeMatches(passcode)) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, makeSessionToken(), sessionCookieOptions());
  return response;
}
