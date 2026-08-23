"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, requireAdmin } from "@/lib/auth";
import { cloudinary, cloudinaryConfigured } from "@/lib/cloudinary";
import type { Settings, WeddingEvent } from "@/lib/settings";
import { setRsvpHidden } from "@/lib/rsvps";
import { saveSettings, getSettings } from "@/lib/store";
import { isThemeId } from "@/lib/themes";

export type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}

/**
 * Every admin action runs through this wrapper so failures always reach the
 * dashboard as a readable `{ ok: false, error }` result instead of a thrown
 * error that leaves buttons stuck mid-save with no feedback.
 */
async function runSafe(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return {
      ok: false,
      error: "Your session expired — please sign in again.",
    };
  }
  try {
    return await fn();
  } catch (error) {
    console.error("[admin] action failed:", error);
    return {
      ok: false,
      error: "Something went wrong while saving. Please try again.",
    };
  }
}

// Kept for callers that only need the boolean check.
export async function assertAdmin(): Promise<boolean> {
  try {
    return await isAdmin();
  } catch {
    return false;
  }
}

export async function setThemeAction(themeId: string): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    if (!isThemeId(themeId)) {
      return { ok: false, error: "Unknown theme." };
    }
    await saveSettings({ theme: themeId });
    refresh();
    return { ok: true };
  });
}

export type ContentInput = {
  couple: {
    first: string;
    second: string;
    brideFullName: string;
    groomFullName: string;
  };
  dateISO: string;
  timezoneLabel: string;
  church: { name: string; address: string; mapsUrl: string };
  venue: { name: string; address: string; mapsUrl: string };
  events: WeddingEvent[];
  spotifyPlaylistUrl: string;
  uploadPasscodeHint: string;
  loveNote: string;
  dressCode: string;
  registryNote: string;
  registryUrl: string;
  entourage: { role: string; namesText: string }[];
};

function clean(value: unknown, max = 160): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function saveContentAction(
  input: ContentInput
): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    const first = clean(input.couple?.first, 60);
    const second = clean(input.couple?.second, 60);
    if (!first || !second) {
      return { ok: false, error: "Both names are required." };
    }
  if (Number.isNaN(new Date(input.dateISO).getTime())) {
    return { ok: false, error: "The date is not valid. Use the format shown." };
  }

  const mapsUrl = clean(input.venue?.mapsUrl, 500);
  if (mapsUrl && !/^https?:\/\//.test(mapsUrl)) {
    return { ok: false, error: "The reception Maps link must start with http(s)://" };
  }
  const churchMapsUrl = clean(input.church?.mapsUrl, 500);
  if (churchMapsUrl && !/^https?:\/\//.test(churchMapsUrl)) {
    return { ok: false, error: "The church Maps link must start with http(s)://" };
  }

  const spotify = clean(input.spotifyPlaylistUrl, 500);
  if (spotify && !/playlist\/[A-Za-z0-9]+/.test(spotify)) {
    return {
      ok: false,
      error: "That does not look like a Spotify playlist URL.",
    };
  }

  const registryUrl = clean(input.registryUrl, 500);
  if (registryUrl && !/^https?:\/\//.test(registryUrl)) {
    return { ok: false, error: "The registry link must start with http(s)://" };
  }

  const entourage = (Array.isArray(input.entourage) ? input.entourage : [])
    .slice(0, 20)
    .map((group) => ({
      role: clean(group?.role, 80),
      names: String(group?.namesText ?? "")
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, 40)
        .map((name) => name.slice(0, 80)),
    }))
    .filter((group) => group.role);

  const events = Array.isArray(input.events) ? input.events : [];
  if (events.length === 0 || events.length > 10) {
    return { ok: false, error: "Add between 1 and 10 events." };
  }
  const cleanedEvents: WeddingEvent[] = events.map((event) => ({
    name: clean(event.name, 80),
    detail: clean(event.detail, 80),
    time: clean(event.time, 60),
    place: clean(event.place, 160),
  }));
  if (cleanedEvents.some((event) => !event.name)) {
    return { ok: false, error: "Every event needs a name." };
  }

  await saveSettings({
    couple: {
      first,
      second,
      brideFullName: clean(input.couple?.brideFullName, 80),
      groomFullName: clean(input.couple?.groomFullName, 80),
    },
    dateISO: clean(input.dateISO, 64),
    timezoneLabel: clean(input.timezoneLabel, 40),
    church: {
      name: clean(input.church?.name, 160),
      address: clean(input.church?.address, 300),
      mapsUrl: churchMapsUrl,
    },
    venue: {
      name: clean(input.venue?.name, 160),
      address: clean(input.venue?.address, 300),
      mapsUrl,
    },
    events: cleanedEvents,
    spotifyPlaylistUrl: spotify,
    uploadPasscodeHint: clean(input.uploadPasscodeHint, 200),
    loveNote: clean(input.loveNote, 400),
    dressCode: clean(input.dressCode, 160),
    registryNote: clean(input.registryNote, 300),
    registryUrl,
    entourage,
  });
  refresh();
  return { ok: true };
  });
}

export async function setGuestPhotosVisibilityAction(
  showNow: boolean
): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    await saveSettings({ guestPhotosShowNow: Boolean(showNow) });
    refresh();
    return { ok: true };
  });
}

export async function setGuestPhotoHiddenAction(
  id: string,
  hidden: boolean
): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    const cleanId = typeof id === "string" ? id.trim().slice(0, 200) : "";
    if (!cleanId) {
      return { ok: false, error: "That photo could not be found." };
    }
    const current = await getSettings();
    const set = new Set(current.hiddenGuestPhotos);
    if (hidden) {
      set.add(cleanId);
    } else {
      set.delete(cleanId);
    }
    await saveSettings({ hiddenGuestPhotos: [...set] });
    refresh();
    return { ok: true };
  });
}

export async function setRsvpHiddenAction(
  id: string,
  hidden: boolean
): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    const updated = await setRsvpHidden(id, hidden);
    if (!updated) {
      return { ok: false, error: "That RSVP no longer exists." };
    }
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  });
}

export async function appendPhotosAction(ids: string[]): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    const current = await getSettings();
    const known = new Set(current.heroPhotos.map((p) => p.id));
    const fresh = ids
      .filter((id) => typeof id === "string" && id && !known.has(id))
      .map((id) => ({ id, showBesideStory: false }));
    await saveSettings({ heroPhotos: [...current.heroPhotos, ...fresh] });
    refresh();
    return { ok: true };
  });
}

export async function removePhotoAction(id: string): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    const current = await getSettings();
    if (cloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(id, { resource_type: "image" });
      } catch (error) {
        console.error("Failed to delete couple photo from Cloudinary", error);
      }
    }
    await saveSettings({
      heroPhotos: current.heroPhotos.filter((p) => p.id !== id),
    });
    refresh();
    return { ok: true };
  });
}

export async function togglePhotoBesideAction(
  id: string,
  show: boolean
): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    const current = await getSettings();
    await saveSettings({
      heroPhotos: current.heroPhotos.map((p) =>
        p.id === id ? { ...p, showBesideStory: Boolean(show) } : p
      ),
    });
    refresh();
    return { ok: true };
  });
}

export async function reorderPhotosAction(orderedIds: string[]): Promise<ActionResult> {
  return runSafe(async (): Promise<ActionResult> => {
    const current = await getSettings();
    const byId = new Map(current.heroPhotos.map((p) => [p.id, p]));
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const untouched = current.heroPhotos.filter((p) => !orderedIds.includes(p.id));
    await saveSettings({ heroPhotos: [...ordered, ...untouched] });
    refresh();
    return { ok: true };
  });
}

export type { Settings };
