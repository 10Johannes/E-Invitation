import { NextResponse } from "next/server";
import { recordOpen } from "@/lib/opens";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

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
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await recordOpen(name);
  } catch (error) {
    console.error("Failed to record open", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
