"use client";

import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import type { GalleryPhoto } from "@/lib/photos";

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState(-1);
  const [activeGuest, setActiveGuest] = useState<string | null>(null);

  const guests = useMemo(() => {
    const counts = new Map<string, number>();
    for (const photo of photos) {
      if (!photo.guest) continue;
      counts.set(photo.guest, (counts.get(photo.guest) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [photos]);

  const visible = useMemo(
    () =>
      activeGuest
        ? photos.filter((photo) => photo.guest === activeGuest)
        : photos,
    [photos, activeGuest]
  );

  const slides = useMemo(
    () =>
      visible.map((photo) => ({
        src: photo.fullUrl,
        description: photo.guest ? `Shared by ${photo.guest}` : undefined,
      })),
    [visible]
  );

  function pickGuest(name: string | null) {
    setActiveGuest(name);
    setIndex(-1);
  }

  return (
    <>
      {guests.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => pickGuest(null)}
            aria-pressed={activeGuest === null}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${
              activeGuest === null
                ? "bg-wine text-ivory"
                : "glass text-charcoal/70 hover:text-wine"
            }`}
          >
            All
          </button>
          {guests.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => pickGuest(name)}
              aria-pressed={activeGuest === name}
              className={`max-w-[12rem] truncate rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${
                activeGuest === name
                  ? "bg-wine text-ivory"
                  : "glass text-charcoal/70 hover:text-wine"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="columns-2 gap-4 sm:columns-3">
        {visible.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Open photo ${i + 1}${photo.guest ? ` shared by ${photo.guest}` : ""}`}
            className="group mb-4 block w-full overflow-hidden rounded-2xl border border-white/50 shadow-lg shadow-wine/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deeprose"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbUrl}
              alt={photo.guest ? `Photo shared by ${photo.guest}` : "Guest photo"}
              loading="lazy"
              className="w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={Math.max(index, 0)}
        slides={slides}
        plugins={[Captions]}
      />
    </>
  );
}
