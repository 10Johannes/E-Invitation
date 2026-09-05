"use client";

import { useEffect, useRef, useState } from "react";
import PolaroidDeck, { type PolaroidDeckHandle } from "./PolaroidDeck";
import { inviteAlreadyOpened } from "@/lib/invite";
import type { CarouselEffect } from "@/lib/carousel";

export type SlidePhoto = { id: string; url: string };

type HeroSlideshowProps = {
  photos: SlidePhoto[];
  effect: CarouselEffect;
};

export default function HeroSlideshow({
  photos,
  effect,
}: HeroSlideshowProps) {
  const [active, setActive] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const deckRef = useRef<PolaroidDeckHandle>(null);

  useEffect(() => {
    function onOpen() {
      setActive(true);
    }
    if (inviteAlreadyOpened()) {
      queueMicrotask(() => setActive(true));
    }
    window.addEventListener("invite:open", onOpen);
    return () => window.removeEventListener("invite:open", onOpen);
  }, []);

  if (photos.length === 0) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-floaty absolute left-[7%] top-[14%] w-32 rotate-[-8deg] sm:w-44">
          <PlaceholderFrame />
        </div>
        <div
          className="animate-floaty absolute right-[6%] top-[28%] w-28 rotate-[6deg] sm:w-40"
          style={{ animationDelay: "1.4s" }}
        >
          <PlaceholderFrame />
        </div>
        <div
          className="animate-floaty absolute bottom-[12%] right-[22%] hidden w-36 rotate-[-5deg] sm:block"
          style={{ animationDelay: "0.7s" }}
        >
          <PlaceholderFrame />
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(delta) > 48) deckRef.current?.go(delta < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      <div className="flex h-full items-center justify-center px-10 sm:px-16">
        <PolaroidDeck
          ref={deckRef}
          photos={photos}
          effect={effect}
          autoplay={active}
        />
      </div>
    </div>
  );
}

function PlaceholderFrame() {
  return (
    <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-wine/25 bg-[var(--t-panel)]/40 backdrop-blur-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-6 w-6 text-wine/40"
        aria-hidden
      >
        <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
        <path d="M8.5 6.5 10 4h4l1.5 2.5" strokeLinecap="round" />
        <circle cx="12" cy="12.5" r="3.25" />
      </svg>
      <span className="px-2 text-center text-[0.55rem] uppercase tracking-[0.25em] text-wine/45">
        Photos coming soon
      </span>
    </div>
  );
}
