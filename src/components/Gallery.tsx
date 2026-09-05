"use client";

import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import PolaroidDeck from "./PolaroidDeck";
import type { GalleryPhoto } from "@/lib/photos";
import { ALBUMS, albumLabel, type AlbumId } from "@/lib/albums";
import type { CarouselEffect } from "@/lib/carousel";

type AlbumFilter = AlbumId | "all";

export default function Gallery({
  photos,
  effect,
}: {
  photos: GalleryPhoto[];
  effect: CarouselEffect;
}) {
  const [selected, setSelected] = useState(-1);
  const [activeAlbum, setActiveAlbum] = useState<AlbumFilter>("all");
  const [activeGuest, setActiveGuest] = useState<string | null>(null);

  const albumPhotos = useMemo(
    () =>
      activeAlbum === "all"
        ? photos
        : photos.filter((photo) => photo.album === activeAlbum),
    [photos, activeAlbum]
  );

  const guests = useMemo(() => {
    const counts = new Map<string, number>();
    for (const photo of albumPhotos) {
      if (!photo.guest) continue;
      counts.set(photo.guest, (counts.get(photo.guest) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [albumPhotos]);

  const visible = useMemo(
    () =>
      activeGuest
        ? albumPhotos.filter((photo) => photo.guest === activeGuest)
        : albumPhotos,
    [albumPhotos, activeGuest]
  );

  const slides = useMemo(
    () =>
      visible.map((photo) => ({
        src: photo.fullUrl,
        description: [
          photo.guest ? `Shared by ${photo.guest}` : null,
          albumLabel(photo.album),
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [visible]
  );

  const deckPhotos = useMemo(
    () =>
      visible.map((photo) => ({
        id: photo.id,
        url: photo.fullUrl,
        caption: [
          photo.guest ? `Shared by ${photo.guest}` : null,
          albumLabel(photo.album),
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [visible]
  );

  function pickAlbum(album: AlbumFilter) {
    setActiveAlbum(album);
    setActiveGuest(null);
    setSelected(-1);
  }

  function pickGuest(name: string | null) {
    setActiveGuest(name);
    setSelected(-1);
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${
      active
        ? "bg-wine text-ivory"
        : "glass text-charcoal/70 hover:text-wine"
    }`;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => pickAlbum("all")}
          aria-pressed={activeAlbum === "all"}
          className={chipClass(activeAlbum === "all")}
        >
          All
        </button>
        {ALBUMS.map((album) => (
          <button
            key={album.id}
            type="button"
            onClick={() => pickAlbum(album.id)}
            aria-pressed={activeAlbum === album.id}
            className={chipClass(activeAlbum === album.id)}
          >
            {album.label}
          </button>
        ))}
      </div>

      {guests.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => pickGuest(null)}
            aria-pressed={activeGuest === null}
            className={`rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.15em] transition ${
              activeGuest === null
                ? "bg-deeprose text-white"
                : "glass text-charcoal/60 hover:text-wine"
            }`}
          >
            Everyone
          </button>
          {guests.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => pickGuest(name)}
              aria-pressed={activeGuest === name}
              className={`max-w-[10rem] truncate rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.15em] transition ${
                activeGuest === name
                  ? "bg-deeprose text-white"
                  : "glass text-charcoal/60 hover:text-wine"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {deckPhotos.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-12 text-center text-sm text-charcoal/60">
          No photos in this selection yet.
        </div>
      ) : (
        <PolaroidDeck
          key={`${activeAlbum}-${activeGuest ?? "all"}`}
          photos={deckPhotos}
          effect={effect}
          onActivate={(_, i) => setSelected(i)}
        />
      )}

      <Lightbox
        open={selected >= 0}
        close={() => setSelected(-1)}
        index={Math.max(selected, 0)}
        slides={slides}
        plugins={[Captions]}
      />
    </>
  );
}
