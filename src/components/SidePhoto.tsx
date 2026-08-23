"use client";

import Image from "next/image";
import Parallax from "./Parallax";

type SidePhotoProps = {
  src: string;
  side?: "left" | "right";
  depth?: number;
  tilt?: number;
  className?: string;
};

export default function SidePhoto({
  src,
  side = "left",
  depth = 0.62,
  tilt = -6,
  className = "",
}: SidePhotoProps) {
  const positionClass =
    side === "left"
      ? "-left-8 xl:-left-14 2xl:-left-24"
      : "-right-8 xl:-right-14 2xl:-right-24";

  return (
    <Parallax
      speed={depth}
      rotate={tilt * 2.4}
      aria-hidden
      className={`pointer-events-none absolute top-[22%] z-0 hidden lg:block ${positionClass} ${className}`}
    >
      <div className="animate-floaty">
        <figure
          className="w-44 rounded-xl bg-[var(--t-panel)] p-3 pb-9 shadow-xl shadow-wine/15 xl:w-52"
          style={{ rotate: `${tilt}deg` }}
        >
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 rounded-sm bg-white/45 shadow-sm backdrop-blur-sm"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-md">
            <Image src={src} alt="" fill sizes="208px" className="object-cover" />
          </div>
        </figure>
      </div>
    </Parallax>
  );
}
