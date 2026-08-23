"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  appendPhotosAction,
  removePhotoAction,
  reorderPhotosAction,
  saveContentAction,
  setGuestPhotoHiddenAction,
  setGuestPhotosVisibilityAction,
  setRsvpHiddenAction,
  setThemeAction,
  togglePhotoBesideAction,
  type ActionResult,
  type ContentInput,
} from "./actions";
import type { PhotoView } from "@/lib/couple-photos";
import { MAX_COUPLE_PHOTOS } from "@/lib/limits";
import type { OpenEntry } from "@/lib/opens";
import type { GalleryPhoto } from "@/lib/photos";
import type { RsvpEntry } from "@/lib/rsvps";
import type { WeddingEvent } from "@/lib/settings";
import { formatShortDate } from "@/config/wedding";
import { THEMES, type ThemeId } from "@/lib/themes";

type Tab = "theme" | "content" | "photos" | "gallery" | "rsvp";

type AdminDashboardProps = {
  theme: ThemeId;
  content: ContentInput;
  photoViews: PhotoView[];
  cloudinaryReady: boolean;
  coupleFirst: string;
  coupleSecond: string;
  guestPhotosShowNow: boolean;
  guestPhotos: GalleryPhoto[];
  hiddenGuestPhotos: string[];
  rsvps: RsvpEntry[];
  opens: OpenEntry[];
};

const TABS: { id: Tab; label: string }[] = [
  { id: "theme", label: "Theme" },
  { id: "content", label: "Content" },
  { id: "photos", label: "Photos" },
  { id: "gallery", label: "Gallery" },
  { id: "rsvp", label: "RSVP" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-charcoal/10 bg-charcoal/5 px-3.5 py-2.5 text-sm text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-deeprose focus:bg-charcoal/10";

export default function AdminDashboard({
  theme,
  content,
  photoViews,
  cloudinaryReady,
  coupleFirst,
  coupleSecond,
  guestPhotosShowNow,
  guestPhotos,
  hiddenGuestPhotos,
  rsvps,
  opens,
}: AdminDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("theme");
  const [message, setMessage] = useState<string | null>(null);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3500);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-wine/70">
            Wedding Admin
          </p>
          <h1 className="mt-1 font-serif text-3xl italic text-gradient">
            {coupleFirst} &amp; {coupleSecond}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-deeprose/40 px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-wine transition hover:bg-charcoal/5"
          >
            View site ↗
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-primary rounded-full px-5 py-2 text-xs font-medium uppercase tracking-[0.15em]"
          >
            Log out
          </button>
        </div>
      </header>

      <nav className="flex gap-2" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "text-white shadow-md"
                : "glass text-charcoal/80 hover:bg-charcoal/5"
            }`}
            style={
              tab === t.id
                ? { backgroundImage: "var(--grad-accent)" }
                : undefined
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {message && (
        <p
          role="status"
          className="glass rounded-2xl px-5 py-3 text-center text-sm text-wine"
        >
          {message}
        </p>
      )}

      {tab === "theme" && (
        <ThemeTab key={theme} activeTheme={theme} onDone={flash} />
      )}
      {tab === "content" && (
        <ContentTab
          initial={content}
          guestPhotosShowNow={guestPhotosShowNow}
          onDone={flash}
        />
      )}
      {tab === "photos" && (
        <PhotosTab
          photoViews={photoViews}
          cloudinaryReady={cloudinaryReady}
          onDone={flash}
        />
      )}
      {tab === "gallery" && (
        <GuestGalleryTab
          photos={guestPhotos}
          initialHidden={hiddenGuestPhotos}
          onDone={flash}
        />
      )}
      {tab === "rsvp" && (
        <RsvpTab rsvps={rsvps} opens={opens} onDone={flash} />
      )}
    </main>
  );
}

function ThemeTab({
  activeTheme,
  onDone,
}: {
  activeTheme: ThemeId;
  onDone: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(activeTheme);

  function choose(id: ThemeId) {
    if (id === optimistic || pending) return;
    setOptimistic(id);
    startTransition(async () => {
      try {
        const result = await setThemeAction(id);
        if (result.ok) {
          onDone("Theme applied — refresh your site tab to see it live.");
        } else {
          setOptimistic(activeTheme);
          onDone(result.error);
        }
      } catch {
        setOptimistic(activeTheme);
        onDone("Could not apply the theme. Please try again.");
      }
    });
  }

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <h2 className="font-serif text-2xl italic text-wine">Pick a palette</h2>
      <p className="mt-1 mb-6 text-sm text-charcoal/70">
        The whole invitation — gradients included — switches instantly.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={pending}
            onClick={() => choose(t.id)}
            className={`group rounded-2xl p-4 text-left transition disabled:opacity-60 ${
              optimistic === t.id
                ? "ring-2 ring-deeprose"
                : "ring-1 ring-charcoal/10 hover:ring-dusty"
            }`}
          >
            <span className="flex h-12 overflow-hidden rounded-xl shadow-inner">
              {t.swatches.map((hex) => (
                <span key={hex} style={{ backgroundColor: hex }} className="flex-1" />
              ))}
            </span>
            <span className="mt-3 flex items-center justify-between">
              <span className="font-serif text-lg italic text-charcoal">
                {t.label}
              </span>
              {optimistic === t.id && (
                <span className="rounded-full bg-deeprose px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-widest text-white">
                  Active
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ContentTab({
  initial,
  guestPhotosShowNow,
  onDone,
}: {
  initial: ContentInput;
  guestPhotosShowNow: boolean;
  onDone: (msg: string) => void;
}) {
  const [form, setForm] = useState<ContentInput>(initial);
  const [lastInitial, setLastInitial] = useState<ContentInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNow, setShowNow] = useState(guestPhotosShowNow);
  const [visibilityPending, startVisibilityTransition] = useTransition();

  function setShow(value: boolean) {
    if (value === showNow || visibilityPending) return;
    setShowNow(value);
    startVisibilityTransition(async () => {
      try {
        const result = await setGuestPhotosVisibilityAction(value);
        if (result.ok) {
          onDone(
            value
              ? "Guest photos will appear in the gallery as soon as they are uploaded."
              : "Guest photos will stay hidden until the wedding day."
          );
        } else {
          setShowNow(!value);
          onDone(result.error);
        }
      } catch {
        setShowNow(!value);
        onDone("Could not save the gallery setting. Please try again.");
      }
    });
  }

  if (initial !== lastInitial) {
    setLastInitial(initial);
    setForm(initial);
  }

  const dateValid = !Number.isNaN(new Date(form.dateISO).getTime());

  function update(patch: Partial<ContentInput>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function updateVenue(patch: Partial<ContentInput["venue"]>) {
    setForm((prev) => ({ ...prev, venue: { ...prev.venue, ...patch } }));
  }

  function updateChurch(patch: Partial<ContentInput["church"]>) {
    setForm((prev) => ({ ...prev, church: { ...prev.church, ...patch } }));
  }

  function updateEvent(index: number, patch: Partial<WeddingEvent>) {
    setForm((prev) => ({
      ...prev,
      events: prev.events.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const result: ActionResult = await saveContentAction(form);
      if (!result.ok) setError(result.error);
      else onDone("Saved — the invitation is updated.");
    } catch {
      setError(
        "Something went wrong while saving. Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <h2 className="font-serif text-2xl italic text-wine">Wedding details</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Bride's first name">
          <input
            value={form.couple.first}
            onChange={(e) =>
              update({ couple: { ...form.couple, first: e.target.value } })
            }
            maxLength={60}
            className={inputClass}
          />
        </Field>
        <Field label="Groom's first name">
          <input
            value={form.couple.second}
            onChange={(e) =>
              update({ couple: { ...form.couple, second: e.target.value } })
            }
            maxLength={60}
            className={inputClass}
          />
        </Field>

        <Field label="Bride's full name" hint='e.g. "Censmar M. Dayola"'>
          <input
            value={form.couple.brideFullName}
            onChange={(e) =>
              update({
                couple: { ...form.couple, brideFullName: e.target.value },
              })
            }
            maxLength={80}
            className={inputClass}
          />
        </Field>
        <Field label="Groom's full name" hint='e.g. "Eduardo M. Bonita"'>
          <input
            value={form.couple.groomFullName}
            onChange={(e) =>
              update({
                couple: { ...form.couple, groomFullName: e.target.value },
              })
            }
            maxLength={80}
            className={inputClass}
          />
        </Field>

        <Field
          label="Date & time"
          hint='ISO format with timezone offset, e.g. 2026-11-21T09:00:00+08:00'
        >
          <input
            value={form.dateISO}
            onChange={(e) => update({ dateISO: e.target.value })}
            className={`${inputClass} ${dateValid ? "" : "!border-deeprose"}`}
          />
          {!dateValid && (
            <p className="mt-1 text-xs text-deeprose">Not a valid date.</p>
          )}
        </Field>
        <Field label="Timezone label" hint='Shown next to the date, e.g. PHT · GMT+8'>
          <input
            value={form.timezoneLabel}
            onChange={(e) => update({ timezoneLabel: e.target.value })}
            maxLength={40}
            className={inputClass}
          />
        </Field>

        <Field label="Church / ceremony venue">
          <input
            value={form.church.name}
            onChange={(e) => updateChurch({ name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Church Google Maps link">
          <input
            value={form.church.mapsUrl}
            onChange={(e) => updateChurch({ mapsUrl: e.target.value })}
            placeholder="https://maps.google.com/?q=…"
            className={inputClass}
          />
        </Field>
        <Field label="Church address">
          <input
            value={form.church.address}
            onChange={(e) => updateChurch({ address: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Reception venue name">
          <input
            value={form.venue.name}
            onChange={(e) => updateVenue({ name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Reception Google Maps link">
          <input
            value={form.venue.mapsUrl}
            onChange={(e) => updateVenue({ mapsUrl: e.target.value })}
            placeholder="https://maps.google.com/?q=…"
            className={inputClass}
          />
        </Field>
        <Field label="Reception address">
          <input
            value={form.venue.address}
            onChange={(e) => updateVenue({ address: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Spotify playlist URL">
          <input
            value={form.spotifyPlaylistUrl}
            onChange={(e) => update({ spotifyPlaylistUrl: e.target.value })}
            placeholder="https://open.spotify.com/playlist/…"
            className={inputClass}
          />
        </Field>

        <Field
          label="Guest upload hint"
          hint="Shown under the event-code box on /upload"
        >
          <input
            value={form.uploadPasscodeHint}
            onChange={(e) => update({ uploadPasscodeHint: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Guest photos in gallery"
          hint="When visitors can see the photos and moments guests share"
        >
          <div className="mt-1.5 grid grid-cols-2 gap-2" role="group">
            {(
              [
                {
                  value: true,
                  label: "Show now",
                  caption: "As soon as guests upload",
                },
                {
                  value: false,
                  label: "Wedding day",
                  caption: `From ${formatShortDate(form.dateISO) || "the big day"} onward`,
                },
              ] as const
            ).map((option) => (
              <button
                key={option.label}
                type="button"
                disabled={visibilityPending}
                aria-pressed={showNow === option.value}
                onClick={() => setShow(option.value)}
                className={`rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60 ${
                  showNow === option.value
                    ? "border-deeprose bg-deeprose/10"
                    : "border-charcoal/10 bg-charcoal/5 hover:border-dusty"
                }`}
              >
                <span className="block text-sm font-medium text-charcoal">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-charcoal/60">
                  {option.caption}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Love note"
          hint="Short handwritten-style message under the invite"
        >
          <textarea
            value={form.loveNote}
            onChange={(e) => update({ loveNote: e.target.value })}
            rows={2}
            maxLength={400}
            className={`${inputClass} resize-none`}
          />
        </Field>
        <Field label="Dress code" hint='e.g. "Garden formal · soft pastels welcome"'>
          <input
            value={form.dressCode}
            onChange={(e) => update({ dressCode: e.target.value })}
            maxLength={160}
            className={inputClass}
          />
        </Field>
        <Field
          label="Gift note"
          hint='e.g. "Cash gifts are warmly appreciated"'
        >
          <input
            value={form.registryNote}
            onChange={(e) => update({ registryNote: e.target.value })}
            maxLength={300}
            className={inputClass}
          />
        </Field>
        <Field label="Registry link" hint="Optional — leave blank to hide the button">
          <input
            value={form.registryUrl}
            onChange={(e) => update({ registryUrl: e.target.value })}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>
      </div>

      <h3 className="mt-9 font-serif text-xl italic text-wine">Events</h3>
      <div className="mt-3 space-y-4">
        {form.events.map((event, index) => (
          <div
            key={index}
            className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.03] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.25em] text-charcoal/50">
                Event {index + 1}
              </span>
              {form.events.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    update({
                      events: form.events.filter((_, i) => i !== index),
                    })
                  }
                  className="rounded-full bg-charcoal/10 px-3 py-1 text-xs text-charcoal transition hover:bg-deeprose hover:text-white"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={event.name}
                onChange={(e) => updateEvent(index, { name: e.target.value })}
                placeholder="Name (e.g. Resepsi)"
                maxLength={80}
                className={inputClass}
              />
              <input
                value={event.detail}
                onChange={(e) => updateEvent(index, { detail: e.target.value })}
                placeholder="Detail (e.g. Reception)"
                maxLength={80}
                className={inputClass}
              />
              <input
                value={event.time}
                onChange={(e) => updateEvent(index, { time: e.target.value })}
                placeholder="Time (e.g. 09:00 – 10:30)"
                maxLength={60}
                className={inputClass}
              />
              <input
                value={event.place}
                onChange={(e) => updateEvent(index, { place: e.target.value })}
                placeholder="Place"
                maxLength={160}
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
      {form.events.length < 10 && (
        <button
          type="button"
          onClick={() =>
            update({
              events: [
                ...form.events,
                { name: "", detail: "", time: "", place: "" },
              ],
            })
          }
          className="mt-4 rounded-full border border-dashed border-dusty px-6 py-2 text-sm text-wine transition hover:bg-charcoal/5"
        >
          + Add event
        </button>
      )}

      <h3 className="mt-9 font-serif text-xl italic text-wine">Entourage</h3>
      <p className="mt-1 text-sm text-charcoal/70">
        One role per card — put each name on its own line. Groups with no names
        stay hidden on the site.
      </p>
      <div className="mt-3 space-y-4">
        {form.entourage.map((group, index) => (
          <div
            key={index}
            className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.03] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <input
                value={group.role}
                onChange={(e) =>
                  update({
                    entourage: form.entourage.map((g, i) =>
                      i === index ? { ...g, role: e.target.value } : g
                    ),
                  })
                }
                placeholder="Role (e.g. Principal Sponsors)"
                maxLength={80}
                className={`${inputClass} mt-0`}
              />
              <button
                type="button"
                onClick={() =>
                  update({
                    entourage: form.entourage.filter((_, i) => i !== index),
                  })
                }
                className="shrink-0 rounded-full bg-charcoal/10 px-3 py-1 text-xs text-charcoal transition hover:bg-deeprose hover:text-white"
              >
                Remove
              </button>
            </div>
            <textarea
              value={group.namesText}
              onChange={(e) =>
                update({
                  entourage: form.entourage.map((g, i) =>
                    i === index ? { ...g, namesText: e.target.value } : g
                  ),
                })
              }
              placeholder={"One name per line\nNinong Juan\nNinang Maria"}
              rows={Math.min(Math.max(group.namesText.split("\n").length, 2), 8)}
              className={`${inputClass} resize-none`}
            />
          </div>
        ))}
      </div>
      {form.entourage.length < 20 && (
        <button
          type="button"
          onClick={() =>
            update({
              entourage: [...form.entourage, { role: "", namesText: "" }],
            })
          }
          className="mt-4 rounded-full border border-dashed border-dusty px-6 py-2 text-sm text-wine transition hover:bg-charcoal/5"
        >
          + Add entourage group
        </button>
      )}

      {error && (
        <p role="alert" className="mt-5 text-sm text-deeprose">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !dateValid}
        className="btn-primary mt-7 rounded-full px-10 py-3 text-sm font-medium tracking-wide disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save details"}
      </button>
    </section>
  );
}

function PhotosTab({
  photoViews,
  cloudinaryReady,
  onDone,
}: {
  photoViews: PhotoView[];
  cloudinaryReady: boolean;
  onDone: (msg: string) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const remainingSlots = Math.max(0, MAX_COUPLE_PHOTOS - photoViews.length);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || busy) return;
    if (remainingSlots === 0) {
      setUploadError(
        `You can keep up to ${MAX_COUPLE_PHOTOS} couple photos. Remove one first.`
      );
      return;
    }

    const files =
      fileList.length > remainingSlots
        ? Array.from(fileList).slice(0, remainingSlots)
        : Array.from(fileList);

    setBusy(true);
    setUploadError(
      files.length < fileList.length
        ? `Only ${remainingSlots} more ${
            remainingSlots === 1 ? "photo was" : "photos were"
          } added — the rest would exceed the ${MAX_COUPLE_PHOTOS}-photo limit.`
        : null
    );

    try {
      const compression = (await import("browser-image-compression")).default;
      const uploadedIds: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const raw = files[i];
        setProgress(`Preparing ${i + 1} of ${files.length}…`);
        const compressed = await compression(raw, {
          maxSizeMB: 1.2,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });
        setProgress(`Uploading ${i + 1} of ${files.length}…`);

        const form = new FormData();
        form.set("file", compressed, raw.name.replace(/\.[^.]+$/, "") + ".jpg");
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: form,
        });
        const data = (await response.json().catch(() => ({}))) as {
          id?: string;
          error?: string;
        };
        if (!response.ok || !data.id) {
          throw new Error(data.error ?? `Upload failed (${response.status})`);
        }
        uploadedIds.push(data.id);
      }

      setProgress("Finishing up…");
      await appendPhotosAction(uploadedIds);
      onDone(
        uploadedIds.length === 1
          ? `Photo added (${photoViews.length + uploadedIds.length}/${MAX_COUPLE_PHOTOS}).`
          : `${uploadedIds.length} photos added.`
      );
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photoViews.length) return;
    const ids = photoViews.map((p) => p.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      const result = await reorderPhotosAction(ids);
      if (result.ok) router.refresh();
      else onDone(result.error);
    } catch {
      onDone("Could not reorder photos. Please try again.");
    }
  }

  async function toggleBeside(id: string, show: boolean) {
    try {
      const result = await togglePhotoBesideAction(id, show);
      if (result.ok) {
        onDone(show ? "Photo now floats along the page edge." : "Photo removed from the page-edge floats.");
        router.refresh();
      } else {
        onDone(result.error);
      }
    } catch {
      onDone("Could not update the photo. Please try again.");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this photo permanently?")) return;
    try {
      const result = await removePhotoAction(id);
      if (result.ok) {
        onDone("Photo deleted.");
        router.refresh();
      } else {
        onDone(result.error);
      }
    } catch {
      onDone("Could not delete the photo. Please try again.");
    }
  }

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <h2 className="font-serif text-2xl italic text-wine">Couple photos</h2>
      <p className="mt-1 text-sm text-charcoal/70">
        These power the hero slideshow. Tick “float beside” to also float them
        along the page edges (up to three are used).
      </p>

      {!cloudinaryReady && (
        <p className="mt-4 rounded-2xl bg-deeprose/10 px-4 py-3 text-sm text-deeprose">
          Cloudinary is not configured yet — add CLOUDINARY_* keys to your
          environment first.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!cloudinaryReady || busy || remainingSlots === 0}
          onClick={() => inputRef.current?.click()}
          className="btn-primary rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-60"
        >
          {busy
            ? (progress ?? "Working…")
            : remainingSlots === 0
              ? "Photo limit reached"
              : "Upload photos"}
        </button>
        <span className="text-xs uppercase tracking-[0.15em] text-charcoal/50">
          {photoViews.length} / {MAX_COUPLE_PHOTOS}
        </span>
      </div>

      {uploadError && (
        <p role="alert" className="mt-3 text-sm text-deeprose">
          {uploadError}
        </p>
      )}

      {photoViews.length === 0 && cloudinaryReady && !busy && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-7 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dusty bg-charcoal/[0.03] px-4 py-12 transition hover:bg-charcoal/[0.06]"
        >
          <span className="font-serif text-xl italic text-wine">
            Upload your first photo
          </span>
          <span className="text-xs text-charcoal/55">
            JPEG or PNG · it becomes part of the hero slideshow
          </span>
        </button>
      )}

      {photoViews.length > 0 && (
        <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photoViews.map((photo, index) => (
            <li key={photo.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white/40">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbUrl}
                  alt=""
                  loading="lazy"
                  className="w-full"
                />
                <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-widest text-white">
                  #{index + 1}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-2">
                <div className="flex gap-1">
                  <IconBtn
                    label={`Move photo ${index + 1} earlier`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </IconBtn>
                  <IconBtn
                    label={`Move photo ${index + 1} later`}
                    disabled={index === photoViews.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </IconBtn>
                </div>
                <IconBtn
                  label={`Delete photo ${index + 1}`}
                  danger
                  onClick={() => remove(photo.id)}
                >
                  ✕
                </IconBtn>
              </div>
              <label className="mx-2 mb-2 flex cursor-pointer items-center gap-2 rounded-lg bg-charcoal/5 px-2 py-1.5 text-[0.65rem] uppercase tracking-wider text-charcoal/80">
                <input
                  type="checkbox"
                  checked={photo.showBesideStory}
                  onChange={(e) => toggleBeside(photo.id, e.target.checked)}
                  className="accent-deeprose"
                />
                Float beside
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GuestGalleryTab({
  photos,
  initialHidden,
  onDone,
}: {
  photos: GalleryPhoto[];
  initialHidden: string[];
  onDone: (msg: string) => void;
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>(initialHidden);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(photo: GalleryPhoto) {
    if (busyId) return;
    const hide = !hiddenIds.includes(photo.id);
    setBusyId(photo.id);
    const previous = hiddenIds;
    setHiddenIds((ids) =>
      hide ? [...ids, photo.id] : ids.filter((id) => id !== photo.id)
    );
    try {
      const result = await setGuestPhotoHiddenAction(photo.id, hide);
      if (result.ok) {
        onDone(
          hide
            ? "Photo hidden from the public gallery."
            : "Photo is visible in the gallery again."
        );
      } else {
        setHiddenIds(previous);
        onDone(result.error);
      }
    } catch {
      setHiddenIds(previous);
      onDone("Could not update that photo. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const hiddenCount = photos.filter((p) => hiddenIds.includes(p.id)).length;

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl italic text-wine">Guest gallery</h2>
        {photos.length > 0 && (
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-charcoal/10 px-3 py-1 uppercase tracking-widest text-charcoal">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </span>
            {hiddenCount > 0 && (
              <span className="rounded-full bg-charcoal/10 px-3 py-1 uppercase tracking-widest text-charcoal/60">
                {hiddenCount} hidden
              </span>
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-sm text-charcoal/70">
        Hiding a photo removes it from the public site only — nothing is ever
        deleted, so this is always reversible.
      </p>

      {photos.length === 0 ? (
        <p className="mt-7 rounded-2xl border border-dashed border-dusty bg-charcoal/[0.03] px-4 py-10 text-center text-sm text-charcoal/60">
          No guest photos yet — uploads appear here as they arrive.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => {
            const hidden = hiddenIds.includes(photo.id);
            return (
              <li
                key={photo.id}
                className={`overflow-hidden rounded-2xl border bg-charcoal/[0.04] transition ${
                  hidden
                    ? "border-charcoal/10 opacity-60"
                    : "border-charcoal/10"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbUrl}
                  alt={photo.guest ? `Photo by ${photo.guest}` : "Guest photo"}
                  loading="lazy"
                  className={`aspect-square w-full object-cover ${
                    hidden ? "grayscale" : ""
                  }`}
                />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base italic text-charcoal">
                      {photo.guest || "Unknown guest"}
                    </p>
                    {photo.createdAt && (
                      <p className="text-xs text-charcoal/45">
                        {new Date(photo.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={busyId === photo.id}
                    onClick={() => toggle(photo)}
                    className="shrink-0 rounded-full bg-charcoal/10 px-3 py-1 text-xs text-charcoal transition hover:bg-charcoal/20 disabled:opacity-40"
                  >
                    {hidden ? "Show" : "Hide"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RsvpTab({
  rsvps,
  opens,
  onDone,
}: {
  rsvps: RsvpEntry[];
  opens: OpenEntry[];
  onDone: (msg: string) => void;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleHidden(id: string, hidden: boolean) {
    setBusyId(id);
    try {
      const result = await setRsvpHiddenAction(id, hidden);
      if (result.ok) {
        onDone(hidden ? "Hidden from the wishes wall." : "Visible again.");
        router.refresh();
      } else {
        onDone(result.error);
      }
    } catch {
      onDone("Could not update that RSVP. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const attending = rsvps.filter((entry) => entry.attending === "yes");
  const seats = attending.reduce((sum, entry) => sum + entry.guests, 0);

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl italic text-wine">RSVP responses</h2>
        {rsvps.length > 0 && (
          <a
            href="/api/admin/export"
            download="wedding-rsvps.csv"
            className="rounded-full border border-deeprose/40 px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-wine transition hover:bg-charcoal/5"
          >
            Export CSV
          </a>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5 text-xs">
        <span className="rounded-full bg-deeprose px-3 py-1 font-medium uppercase tracking-widest text-white">
          {attending.length} accepting
        </span>
        <span className="rounded-full bg-charcoal/10 px-3 py-1 uppercase tracking-widest text-charcoal">
          {seats} {seats === 1 ? "seat" : "seats"}
        </span>
        <span className="rounded-full bg-charcoal/10 px-3 py-1 uppercase tracking-widest text-charcoal">
          {rsvps.length} total
        </span>
      </div>

      {rsvps.length === 0 ? (
        <p className="mt-7 rounded-2xl border border-dashed border-dusty bg-charcoal/[0.03] px-4 py-10 text-center text-sm text-charcoal/60">
          No RSVPs yet — replies appear here as guests respond.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rsvps.map((entry) => (
            <li
              key={entry.id}
              className={`rounded-2xl border border-charcoal/10 p-4 ${
                entry.hidden ? "bg-charcoal/[0.02] opacity-70" : "bg-charcoal/[0.04]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-lg italic text-charcoal">
                    {entry.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-widest ${
                      entry.attending === "yes"
                        ? "bg-deeprose text-white"
                        : "bg-charcoal/15 text-charcoal"
                    }`}
                  >
                    {entry.attending === "yes"
                      ? `Attending · ${entry.guests}`
                      : "Declined"}
                  </span>
                  {entry.hidden && (
                    <span className="rounded-full bg-charcoal/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-widest text-charcoal/60">
                      Hidden
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={busyId === entry.id}
                  onClick={() => toggleHidden(entry.id, !entry.hidden)}
                  className="shrink-0 rounded-full bg-charcoal/10 px-3 py-1 text-xs text-charcoal transition hover:bg-charcoal/20 disabled:opacity-40"
                >
                  {entry.hidden ? "Show" : "Hide"}
                </button>
              </div>
              {entry.message && (
                <p className="mt-2 font-serif text-sm italic leading-relaxed text-charcoal/75">
                  “{entry.message}”
                </p>
              )}
              <p className="mt-1.5 text-xs text-charcoal/45">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <OpensCard opens={opens} />
    </section>
  );
}

function OpensCard({ opens }: { opens: OpenEntry[] }) {
  return (
    <div className="mt-8 border-t border-charcoal/10 pt-6">
      <h3 className="font-serif text-xl italic text-wine">Invitation opens</h3>
      <p className="mt-1 text-xs text-charcoal/55">
        The first time each named guest opened their invitation link, plus
        repeat visits.
      </p>
      {opens.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-dusty bg-charcoal/[0.03] px-4 py-8 text-center text-sm text-charcoal/60">
          No opens recorded yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {opens.map((entry) => (
            <li
              key={entry.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-charcoal/[0.04] px-4 py-2.5"
            >
              <span className="font-serif text-base italic text-charcoal">
                {entry.name}
              </span>
              <span className="text-xs text-charcoal/55">
                {new Date(entry.firstOpenedAt).toLocaleString()}
                {entry.opens > 1 && ` · ${entry.opens}×`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition ${
        danger
          ? "bg-charcoal/10 text-charcoal hover:bg-deeprose hover:text-white"
          : "bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-charcoal">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-charcoal/50">{hint}</span>}
    </label>
  );
}
