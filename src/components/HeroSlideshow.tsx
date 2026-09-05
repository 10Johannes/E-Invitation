"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { inviteAlreadyOpened } from "@/lib/invite";

export type SlidePhoto = { id: string; url: string };

type HeroSlideshowProps = {
  photos: SlidePhoto[];
};

const SLIDE_INTERVAL_MS = 5500;

export default function HeroSlideshow({ photos }: HeroSlideshowProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [portraitSlide, setPortraitSlide] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reset the focal bias whenever the visible slide changes.
  const currentSlideId = photos[index]?.id;
  const [trackedSlideId, setTrackedSlideId] = useState(currentSlideId);
  if (currentSlideId !== trackedSlideId) {
    setTrackedSlideId(currentSlideId);
    setPortraitSlide(false);
  }

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

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((current) => (current + dir + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    if (!active || photos.length < 2 || reduceMotion) return;
    const timer = setInterval(() => go(1), SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, go, photos.length, reduceMotion]);

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

  const current = photos[index];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(delta) > 48) go(delta < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 1.4, ease: "easeInOut" }}
        >
          {/* Portrait backdrops stay OUTSIDE the zoom layer: animating a
              blurred full-screen image forces a repaint every frame. Static
              here + GPU-composited zoom below keeps it smooth. */}
          {portraitSlide && (
            <Image
              src={current.url}
              alt=""
              fill
              aria-hidden
              sizes="100vw"
              className="scale-125 object-cover opacity-90 blur-xl"
            />
          )}
          <Image
            src={current.url}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={portraitSlide ? "object-contain" : "object-cover"}
            onLoad={(event) => {
              const img = event.currentTarget;
              if (img.naturalWidth > 0) {
                setPortraitSlide(img.naturalHeight > img.naturalWidth * 1.05);
              }
            }}
          />
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && active && (
        <>
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2.5 sm:bottom-8">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index
                    ? "w-7 bg-[var(--t-panel)]"
                    : "w-1.5 bg-[var(--t-panel)]/50 hover:bg-[var(--t-panel)]/80"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            className="glass absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg text-wine transition hover:bg-charcoal/5 md:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            className="glass absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg text-wine transition hover:bg-charcoal/5 md:flex"
          >
            ›
          </button>
        </>
      )}
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
