import type { Settings } from "@/lib/settings";

/**
 * Seed values used until the admin panel saves its own settings
 * (and as fallbacks whenever a stored field is missing).
 * Everything here is editable at /admin — including times.
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: "dusty-pink",
  couple: {
    first: "Censmar",
    second: "Eduardo",
    brideFullName: "Censmar M. Dayola",
    groomFullName: "Eduardo M. Bonita",
  },
  dateISO: "2026-10-10T14:00:00+08:00",
  timezoneLabel: "PHT · GMT+8",
  church: {
    name: "Our Lady of Assumption Parish",
    address: "Maasin City, Southern Leyte",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Our+Lady+of+Assumption+Parish+Maasin+City+Southern+Leyte",
  },
  venue: {
    name: "Coastal Gatherings by Villa Romana",
    address: "Maasin City, Southern Leyte",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Coastal+Gatherings+by+Villa+Romana+Maasin+City+Southern+Leyte",
  },
  events: [
    {
      name: "Holy Mass",
      detail: "Ceremony",
      time: "2:00 PM",
      place: "Our Lady of Assumption Parish",
    },
    {
      name: "Reception",
      detail: "Celebration",
      time: "To follow",
      place: "Coastal Gatherings by Villa Romana",
    },
  ],
  spotifyPlaylistUrl: "",
  uploadPasscodeHint: "the code printed at the bottom of your invitation card",
  guestPhotosShowNow: true,
  heroPhotos: [],
  loveNote:
    "We found the one our souls love, and today we begin forever — we would be honoured to have you with us.",
  dressCode: "Garden formal · soft pastels welcome",
  registryNote: "Your presence is the greatest gift. Cash gifts are warmly appreciated.",
  registryUrl: "",
  entourage: [
    { role: "Principal Sponsors", names: [] },
    { role: "Best Man", names: [] },
    { role: "Maid of Honor", names: [] },
    { role: "Bridesmaids", names: [] },
    { role: "Groomsmen", names: [] },
    { role: "Flower Girl", names: [] },
    { role: "Ring Bearer", names: [] },
  ],
};

export function spotifyEmbedUrl(playlistUrl: string): string | null {
  const match = playlistUrl.match(/playlist\/([A-Za-z0-9]+)/);
  return match
    ? `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0`
    : null;
}

export function formatDateLabel(dateISO: string): string {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(dateISO: string): string {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function weddingYear(dateISO: string): number {
  const date = new Date(dateISO);
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}
