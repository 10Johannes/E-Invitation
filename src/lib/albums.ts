export const ALBUMS = [
  { id: "pre-wedding", label: "Pre-Wedding" },
  { id: "wedding-day", label: "Wedding Day" },
  { id: "wedding-ceremony", label: "Wedding Ceremony" },
  { id: "after-party", label: "After Party" },
] as const;

export type AlbumId = (typeof ALBUMS)[number]["id"];

/**
 * Photos uploaded before albums existed (or with an unknown value)
 * are treated as belonging to the main day.
 */
export const DEFAULT_ALBUM: AlbumId = "wedding-day";

const ALBUM_IDS: ReadonlySet<string> = new Set(ALBUMS.map((a) => a.id));

export function isAlbumId(value: unknown): value is AlbumId {
  return typeof value === "string" && ALBUM_IDS.has(value);
}

/** Coerce any value (missing, legacy or invalid) into a valid album id. */
export function toAlbumId(value: unknown): AlbumId {
  return isAlbumId(value) ? value : DEFAULT_ALBUM;
}

export function albumLabel(id: AlbumId): string {
  return ALBUMS.find((a) => a.id === id)?.label ?? id;
}
