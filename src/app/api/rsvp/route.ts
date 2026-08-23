import { NextResponse } from "next/server";
import { addRsvp } from "@/lib/rsvps";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

const recentByIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const stamps = (recentByIp.get(ip) ?? []).filter(
    (stamp) => now - stamp < WINDOW_MS
  );
  if (stamps.length >= MAX_PER_WINDOW) {
    return true;
  }
  stamps.push(now);
  recentByIp.set(ip, stamps);
  if (recentByIp.size > 5000) {
    for (const [key, value] of recentByIp) {
      if (value.every((stamp) => now - stamp >= WINDOW_MS)) {
        recentByIp.delete(key);
      }
    }
  }
  return false;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please wait a moment." },
      { status: 429 }
    );
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const attending = body.attending === "no" ? "no" : body.attending === "yes" ? "yes" : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const guestsRaw = Number(body.guests);

  if (!name || name.length > 80) {
    return NextResponse.json(
      { ok: false, error: "Please enter your name (80 characters max)." },
      { status: 400 }
    );
  }
  if (!attending) {
    return NextResponse.json(
      { ok: false, error: "Please choose whether you can attend." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(guestsRaw) || guestsRaw < 1 || guestsRaw > 12) {
    return NextResponse.json(
      { ok: false, error: "Seats must be between 1 and 12." },
      { status: 400 }
    );
  }

  await addRsvp({
    name,
    attending,
    guests: guestsRaw,
    message,
  });

  return NextResponse.json({ ok: true });
}
