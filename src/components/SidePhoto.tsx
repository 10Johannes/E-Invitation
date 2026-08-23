"use client";

import Image from "next/image";
import { useState } from "react";

type SidePhotoProps = {
  src: string;
  side?: "left" | "right";
  tilt?: number;
  className?: string;
};

/**
 * A polaroid-style photo pinned to the page edge. The outer rail stretches
 * the full height of its positioned parent and the inner frame uses
 * `position: sticky`, so the photo pins into view as soon as its section
 * reaches it and stays alongside for the whole section — no scroll-lottery.
 * The frame adopts the photo's natural aspect ratio once loaded, so nothing
 * is ever cropped away.
 */
export default function SidePhoto({
  src,
  side = "left",
  tilt = -6,
  className = "",
}: SidePhotoProps) {
  const [ratio, setRatio] = useState<number | null>(null);

  const positionClass =
    side === "left"
      ? "-left-8 xl:-left-14 2xl:-left-24"
      : "-right-8 xl:-right-14 2xl:-right-24";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 z-0 hidden lg:block ${positionClass} ${className}`}
    >
      <div className="sticky top-32 py-6">
        <div className="animate-floaty">
          <figure
            className={`w-44 rounded-xl bg-[var(--t-panel)] p-3 pb-9 shadow-xl shadow-wine/15 xl:w-52 ${
              ratio === null ? "aspect-[4/5]" : ""
            }`}
            style={{ rotate: `${tilt}deg` }}
          >
            <span
              aria-hidden
              className="absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-sm bg-white/45 shadow-sm backdrop-blur-sm"
            />
            <div
              className="relative overflow-hidden rounded-md"
              style={ratio !== null ? { aspectRatio: `${ratio}` } : undefined}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="208px"
                className="object-cover"
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (img.naturalWidth > 0) {
                    setRatio(img.naturalWidth / img.naturalHeight);
                  }
                }}
              />
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
}
