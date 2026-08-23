import { promises as fs } from "fs";
import path from "path";

export type OpenEntry = {
  name: string;
  firstOpenedAt: number;
  opens: number;
};

const FILE_PATH = path.join(process.cwd(), ".data", "opens.json");
const REDIS_KEY = "wedding-opens";
const MAX_ENTRIES = 500;

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function upstashGet(): Promise<OpenEntry[] | null> {
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
    return Array.isArray(parsed) ? (parsed as OpenEntry[]) : [];
  } catch {
    return [];
  }
}

async function upstashSet(entries: OpenEntry[]): Promise<void> {
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

async function fileGet(): Promise<OpenEntry[] | null> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OpenEntry[]) : [];
  } catch {
    return null;
  }
}

async function fileSet(entries: OpenEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(entries, null, 2), "utf8");
}

function normalizeEntry(raw: unknown): OpenEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<OpenEntry>;
  if (typeof entry.name !== "string" || entry.name.trim() === "") return null;
  return {
    name: entry.name.slice(0, 80),
    firstOpenedAt:
      typeof entry.firstOpenedAt === "number" &&
      Number.isFinite(entry.firstOpenedAt)
        ? entry.firstOpenedAt
        : Date.now(),
    opens:
      typeof entry.opens === "number" && Number.isFinite(entry.opens)
        ? Math.min(Math.max(Math.round(entry.opens), 1), 100_000)
        : 1,
  };
}

export async function getOpens(): Promise<OpenEntry[]> {
  let raw: OpenEntry[] | null = null;
  try {
    raw = upstashConfigured() ? await upstashGet() : await fileGet();
  } catch (error) {
    console.error("Failed to read invitation opens", error);
  }

  return (raw ?? [])
    .map(normalizeEntry)
    .filter((entry): entry is OpenEntry => entry !== null)
    .sort((a, b) => b.firstOpenedAt - a.firstOpenedAt)
    .slice(0, MAX_ENTRIES);
}

async function saveOpens(entries: OpenEntry[]): Promise<void> {
  if (upstashConfigured()) {
    await upstashSet(entries);
  } else {
    await fileSet(entries);
  }
}

export async function recordOpen(rawName: string): Promise<OpenEntry> {
  const name = rawName.trim().replace(/\s+/g, " ").slice(0, 80);
  const current = await getOpens();
  const now = Date.now();

  const existingIndex = current.findIndex(
    (entry) => entry.name.toLowerCase() === name.toLowerCase()
  );

  if (existingIndex >= 0) {
    const updated: OpenEntry = {
      ...current[existingIndex],
      opens: Math.min(current[existingIndex].opens + 1, 100_000),
    };
    current[existingIndex] = updated;
    await saveOpens(current.slice(0, MAX_ENTRIES));
    return updated;
  }

  const fresh: OpenEntry = { name, firstOpenedAt: now, opens: 1 };
  await saveOpens([fresh, ...current].slice(0, MAX_ENTRIES));
  return fresh;
}
