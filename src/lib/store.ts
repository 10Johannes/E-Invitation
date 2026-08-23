import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "@/config/wedding";
import { DEFAULT_THEME, isThemeId } from "@/lib/themes";
import type { Settings } from "@/lib/settings";

const FILE_PATH = path.join(process.cwd(), ".data", "settings.json");
const REDIS_KEY = "wedding-settings";

let memoryCache: Settings | null = null;

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

const UPSTASH_TIMEOUT_MS = 8000;

async function upstashGet(): Promise<Settings | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const response = await fetch(`${url}/get/${REDIS_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Upstash GET failed (${response.status})`);
  }
  const data = (await response.json()) as { result?: string | null };
  return data.result ? (JSON.parse(data.result) as Settings) : null;
}

async function upstashSet(settings: Settings): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  const response = await fetch(`${url}/set/${REDIS_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: JSON.stringify(settings),
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Upstash SET failed (${response.status})`);
  }
}

async function fileGet(): Promise<Settings | null> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as Settings;
  } catch {
    return null;
  }
}

async function fileSet(settings: Settings): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(settings, null, 2), "utf8");
}

function normalize(raw: Partial<Settings> | null): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };

  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    theme: isThemeId(raw.theme) ? raw.theme : DEFAULT_THEME,
    guestPhotosShowNow:
      typeof raw.guestPhotosShowNow === "boolean"
        ? raw.guestPhotosShowNow
        : DEFAULT_SETTINGS.guestPhotosShowNow,
    couple: { ...DEFAULT_SETTINGS.couple, ...raw.couple },
    church: { ...DEFAULT_SETTINGS.church, ...raw.church },
    venue: { ...DEFAULT_SETTINGS.venue, ...raw.venue },
    events: Array.isArray(raw.events)
      ? raw.events.map((e) => ({ ...e }))
      : DEFAULT_SETTINGS.events,
    heroPhotos: Array.isArray(raw.heroPhotos)
      ? raw.heroPhotos.filter((p) => p && typeof p.id === "string")
      : [],
    entourage: Array.isArray(raw.entourage)
      ? raw.entourage
          .filter((g) => g && typeof g.role === "string")
          .map((g) => ({
            role: String(g.role),
            names: Array.isArray(g.names)
              ? g.names.filter((n): n is string => typeof n === "string")
              : [],
          }))
          .filter((g) => g.role)
      : DEFAULT_SETTINGS.entourage,
  };
}

export async function getSettings(): Promise<Settings> {
  if (memoryCache) return memoryCache;

  let raw: Settings | null = null;
  try {
    raw = upstashConfigured() ? await upstashGet() : await fileGet();
  } catch (error) {
    console.error("Failed to read settings", error);
  }

  memoryCache = normalize(raw);
  return memoryCache;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = normalize({ ...current, ...patch });

  if (upstashConfigured()) {
    await upstashSet(next);
  } else {
    await fileSet(next);
  }

  memoryCache = next;
  return next;
}
