import { promises as fs } from "fs";
import path from "path";

export type RsvpEntry = {
  id: string;
  name: string;
  attending: "yes" | "no";
  guests: number;
  message: string;
  hidden: boolean;
  createdAt: number;
};

const FILE_PATH = path.join(process.cwd(), ".data", "rsvps.json");
const REDIS_KEY = "wedding-rsvps";
const MAX_ENTRIES = 500;

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function upstashGet(): Promise<RsvpEntry[] | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const response = await fetch(`${url}/get/${REDIS_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { result?: string | null };
  if (!data.result) return [];
  try {
    const parsed = JSON.parse(data.result);
    return Array.isArray(parsed) ? (parsed as RsvpEntry[]) : [];
  } catch {
    return [];
  }
}

async function upstashSet(entries: RsvpEntry[]): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  const response = await fetch(`${url}/set/${REDIS_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: JSON.stringify(entries),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Upstash SET failed (${response.status})`);
  }
}

async function fileGet(): Promise<RsvpEntry[] | null> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RsvpEntry[]) : [];
  } catch {
    return null;
  }
}

async function fileSet(entries: RsvpEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(entries, null, 2), "utf8");
}

function normalizeEntry(raw: unknown): RsvpEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<RsvpEntry>;
  if (typeof entry.id !== "string" || typeof entry.name !== "string") return null;
  return {
    id: entry.id,
    name: entry.name.slice(0, 80),
    attending: entry.attending === "no" ? "no" : "yes",
    guests:
      typeof entry.guests === "number" && Number.isFinite(entry.guests)
        ? Math.min(Math.max(Math.round(entry.guests), 1), 12)
        : 1,
    message: typeof entry.message === "string" ? entry.message.slice(0, 280) : "",
    hidden: Boolean(entry.hidden),
    createdAt:
      typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
        ? entry.createdAt
        : Date.now(),
  };
}

export async function getRsvps(): Promise<RsvpEntry[]> {
  let raw: RsvpEntry[] | null = null;
  try {
    raw = upstashConfigured() ? await upstashGet() : await fileGet();
  } catch (error) {
    console.error("Failed to read RSVPs", error);
  }

  return (raw ?? [])
    .map(normalizeEntry)
    .filter((entry): entry is RsvpEntry => entry !== null)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_ENTRIES);
}

async function saveRsvps(entries: RsvpEntry[]): Promise<void> {
  if (upstashConfigured()) {
    await upstashSet(entries);
  } else {
    await fileSet(entries);
  }
}

export type NewRsvpInput = {
  name: string;
  attending: "yes" | "no";
  guests: number;
  message: string;
};

export async function addRsvp(input: NewRsvpInput): Promise<RsvpEntry> {
  const current = await getRsvps();
  const entry: RsvpEntry = {
    id: crypto.randomUUID(),
    name: input.name.slice(0, 80),
    attending: input.attending,
    guests: Math.min(Math.max(Math.round(input.guests), 1), 12),
    message: input.message.slice(0, 280),
    hidden: false,
    createdAt: Date.now(),
  };
  await saveRsvps([entry, ...current].slice(0, MAX_ENTRIES));
  return entry;
}

export async function setRsvpHidden(id: string, hidden: boolean): Promise<boolean> {
  const current = await getRsvps();
  const target = current.find((entry) => entry.id === id);
  if (!target) return false;
  await saveRsvps(
    current.map((entry) =>
      entry.id === id ? { ...entry, hidden: Boolean(hidden) } : entry
    )
  );
  return true;
}
