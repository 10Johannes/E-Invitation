"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import PolaroidCard from "./PolaroidCard";
import type { CarouselEffect } from "@/lib/carousel";

export type CarouselPhoto = { id: string; url: string; caption?: string };

type PolaroidDeckProps = {
  photos: CarouselPhoto[];
  effect: CarouselEffect;
  autoplay?: boolean;
  onActivate?: (photo: CarouselPhoto, index: number) => void;
  className?: string;
};

export type PolaroidDeckHandle = {
  go: (dir: 1 | -1) => void;
};

const AUTOPLAY_MS = 5500;

const BEHIND_SLOTS: Record<number, string> = {
  0: "pointer-events-none -translate-x-3 translate-y-2 scale-[0.94]",
  1: "pointer-events-none translate-x-3 -translate-y-1 scale-[0.9]",
};

const BEHIND_ROTATIONS: Record<number, number> = { 0: -4, 1: 6 };
const BEHIND_BLUR: Record<number, string> = { 0: "", 1: "blur-[1px]" };

function buildVariants(reduceMotion: boolean, effect: CarouselEffect): Variants {
  if (reduceMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  switch (effect) {
    case "fan":
      return {
        enter: (dir: number) => ({
          opacity: 0,
          x: dir * 110,
          rotate: dir * 12,
        }),
        center: { opacity: 1, x: 0, rotate: 0 },
        exit: (dir: number) => ({
          opacity: 0,
          x: dir * -90,
          rotate: dir * -10,
        }),
      };
    case "flip":
      return {
        enter: (dir: number) => ({
          opacity: 0,
          rotateY: dir * 85,
          scale: 0.92,
          transformPerspective: 900,
        }),
        center: { opacity: 1, rotateY: 0, scale: 1 },
        exit: (dir: number) => ({
          opacity: 0,
          rotateY: dir * -85,
          scale: 0.92,
          transformPerspective: 900,
        }),
      };
    case "swirl":
      return {
        enter: () => ({ opacity: 0, rotate: 26, scale: 0.65 }),
        center: { opacity: 1, rotate: 0, scale: 1 },
        exit: () => ({ opacity: 0, rotate: -22, scale: 0.65 }),
      };
    default:
      return {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
}

const PolaroidDeck = forwardRef<PolaroidDeckHandle, PolaroidDeckProps>(
  function PolaroidDeck(
    { photos, effect, autoplay = false, onActivate, className = "" },
    ref
  ) {
    const reduceMotion = useReducedMotion();
    const [index, setIndex] = useState(0);
    const direction = useRef<1 | -1>(1);

    useEffect(() => {
      if (index >= photos.length) setIndex(0);
    }, [index, photos.length]);

    const go = useCallback(
      (dir: 1 | -1) => {
        if (photos.length < 2) return;
        direction.current = dir;
        setIndex((current) =>
          (current + dir + photos.length) % photos.length
        );
      },
      [photos.length]
    );

    const goTo = useCallback(
      (target: number) => {
        if (photos.length < 2) return;
        setIndex((current) => {
          const normalized =
            ((target % photos.length) + photos.length) % photos.length;
          direction.current =
            normalized === current ? 1 : normalized > current ? 1 : -1;
          return normalized;
        });
      },
      [photos.length]
    );

    useImperativeHandle(ref, () => ({ go }), [go]);

    useEffect(() => {
      if (!autoplay || photos.length < 2 || reduceMotion) return;
      const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
      return () => window.clearInterval(timer);
    }, [autoplay, photos.length, reduceMotion, go]);

    if (photos.length === 0) return null;

    const currentIndex = Math.min(index, photos.length - 1);
    const current = photos[currentIndex];
    const behindCount = Math.min(2, photos.length - 1);
    const behind = Array.from({ length: behindCount }, (_, slot) =>
      photos[(currentIndex + slot + 1) % photos.length]
    );

    const variants = buildVariants(Boolean(reduceMotion), effect);
    const transition: Transition = {
      duration: reduceMotion ? 0 : 0.75,
      ease: [0.22, 0.61, 0.36, 1],
    };

    return (
      <div className={`relative flex flex-col items-center gap-5 ${className}`}>
        <div className="relative w-40 sm:w-56 lg:w-64">
          {behind.map((photo, slot) => (
            <div
              key={photo.id}
              aria-hidden
              className={`absolute inset-0 grid place-items-center ${BEHIND_SLOTS[slot]} ${
                behind.length === 2 && slot === 1 ? "opacity-80" : "opacity-90"
              }`}
            >
              <PolaroidCard
                src={photo.url}
                alt=""
                rotation={BEHIND_ROTATIONS[slot] ?? 0}
                className={`w-full ${BEHIND_BLUR[slot] ?? ""}`}
              />
            </div>
          ))}

          <AnimatePresence custom={direction.current} initial={false}>
            <motion.div
              key={current.id}
              custom={direction.current}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="relative grid place-items-center"
            >
              {onActivate ? (
                <button
                  type="button"
                  onClick={() => onActivate(current, currentIndex)}
                  aria-label={`Open photo ${currentIndex + 1}${
                    current.caption ? ` — ${current.caption}` : ""
                  } in a lightbox`}
                  className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-deeprose rounded-lg"
                >
                  <PolaroidCard
                    src={current.url}
                    alt={current.caption ?? `Photo ${currentIndex + 1}`}
                    caption={current.caption}
                    priority={currentIndex === 0}
                    className="w-full"
                  />
                </button>
              ) : (
                <PolaroidCard
                  src={current.url}
                  alt={current.caption ?? `Photo ${currentIndex + 1}`}
                  caption={current.caption}
                  priority={currentIndex === 0}
                  className="w-full"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => go(-1)}
                className="glass absolute -left-11 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg text-wine transition hover:bg-charcoal/5 sm:-left-14"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => go(1)}
                className="glass absolute -right-11 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg text-wine transition hover:bg-charcoal/5 sm:-right-14"
              >
                ›
              </button>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex items-center gap-2.5">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                onClick={() => goTo(i)}
                aria-current={i === currentIndex}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentIndex
                    ? "w-7 bg-[var(--t-panel)]"
                    : "w-1.5 bg-[var(--t-panel)]/50 hover:bg-[var(--t-panel)]/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

export default PolaroidDeck;