"use client";

import Image from "next/image";

type PolaroidCardProps = {
  src: string;
  alt?: string;
  caption?: string;
  rotation?: number;
  className?: string;
  priority?: boolean;
};

export default function PolaroidCard({
  src,
  alt = "",
  caption,
  rotation = 0,
  className = "",
  priority = false,
}: PolaroidCardProps) {
  return (
    <div
      className={`relative rounded-md bg-ivory p-2.5 pb-3 shadow-xl shadow-wine/15 ring-1 ring-wine/10 sm:p-3 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        aria-hidden
        className="absolute -top-2.5 left-1/2 z-10 h-5 w-14 rounded-[2px] bg-white/70 shadow-sm"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />
      <div className="relative aspect-square w-full overflow-hidden rounded-[3px] bg-wine/5">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 288px, 448px"
          className="h-full w-full object-cover"
        />
      </div>
      {caption && (
        <p className="mt-2 max-w-full truncate text-center font-script text-lg leading-none text-charcoal sm:text-xl">
          {caption}
        </p>
      )}
    </div>
  );
}