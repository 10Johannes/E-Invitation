"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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

/**
 * Every card on stage is a persistent motion element keyed by photo id.
 * Navigating only changes *which slot each card targets*, so framer glides
 * the same DOM node between slots — the tucked-back card literally rises to
 * the front and the front card deals away. Slot ordering, front to back:
 *   0 TOP · 1 P1 · 2 P2 · 3 HOLD (invisible warmer that preloads the next shot)
 */
type EffectGeometry = {
  rest: TargetAndTransition[];
  inTop: TargetAndTransition;
  outTop: TargetAndTransition;
  outBack: TargetAndTransition;
};

const P = { transformPerspective: 900 };

const GEOMETRY: Record<CarouselEffect, EffectGeometry> = {
  fan: {
    rest: [
      { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 30 },
      { x: 18, y: 8, rotate: 6, scale: 0.94, opacity: 1, zIndex: 20 },
      { x: -20, y: 14, rotate: -7, scale: 0.87, opacity: 0.75, zIndex: 10 },
      { x: 0, y: 70, rotate: 0, scale: 0.8, opacity: 0, zIndex: 0 },
    ],
    inTop: { x: 6, y: -52, rotate: 8, scale: 1.16, opacity: 0, zIndex: 30 },
    outTop: { x: -8, y: -96, rotate: -6, scale: 1.06, opacity: 0, zIndex: 30 },
    outBack: { x: -44, y: 56, rotate: -9, scale: 0.72, opacity: 0, zIndex: 0 },
  },
  flip: {
    rest: [
      { x: 0, y: 0, rotateY: 0, scale: 1, opacity: 1, zIndex: 30, ...P },
      { x: 14, y: 8, rotateY: 25, scale: 0.94, opacity: 1, zIndex: 20, ...P },
      { x: -16, y: 14, rotateY: -35, scale: 0.9, opacity: 0.75, zIndex: 10, ...P },
      { x: 0, y: 70, rotateY: 40, scale: 0.8, opacity: 0, zIndex: 0, ...P },
    ],
    inTop: { x: 4, y: -52, rotateY: -70, scale: 1.1, opacity: 0, zIndex: 30, ...P },
    outTop: { x: -6, y: -96, rotateY: 70, scale: 1.05, opacity: 0, zIndex: 30, ...P },
    outBack: { x: -40, y: 56, rotateY: -60, scale: 0.72, opacity: 0, zIndex: 0, ...P },
  },
  swirl: {
    rest: [
      { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 30 },
      { x: 16, y: 8, rotate: 9, scale: 0.95, opacity: 1, zIndex: 20 },
      { x: -18, y: 14, rotate: -11, scale: 0.88, opacity: 0.75, zIndex: 10 },
      { x: 0, y: 70, rotate: 24, scale: 0.8, opacity: 0, zIndex: 0 },
    ],
    inTop: { x: 4, y: -40, rotate: -120, scale: 1.12, opacity: 0, zIndex: 30 },
    outTop: { x: -4, y: -92, rotate: 140, scale: 1.08, opacity: 0, zIndex: 30 },
    outBack: { x: -40, y: 56, rotate: -150, scale: 0.72, opacity: 0, zIndex: 0 },
  },
};

const PolaroidDeck = forwardRef<PolaroidDeckHandle, PolaroidDeckProps>(
  function PolaroidDeck(
    { photos, effect, autoplay = false, onActivate, className = "" },
    ref
  ) {
    const reduceMotion = useReducedMotion();
    const [index, setIndex] = useState(0);

    useEffect(() => {
      if (index >= photos.length) setIndex(0);
    }, [index, photos.length]);

    const go = useCallback(
      (dir: 1 | -1) => {
        if (photos.length < 2) return;
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

    const geometry = GEOMETRY[effect];
    const transition: Transition = {
      duration: reduceMotion ? 0 : 0.7,
      ease: [0.22, 0.61, 0.36, 1],
    };

    if (photos.length === 1) {
      const photo = photos[0];
      return (
        <div className={`relative flex flex-col items-center gap-5 ${className}`}>
          <div className="relative w-40 sm:w-56 lg:w-64">
            {onActivate ? (
              <button
                type="button"
                onClick={() => onActivate(photo, 0)}
                aria-label={photo.caption ?? "Open the photo larger"}
                className="block w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-deeprose"
              >
                <PolaroidCard
                  src={photo.url}
                  alt={photo.caption ?? "Photo 1"}
                  caption={photo.caption}
                  priority
                  className="w-full"
                />
              </button>
            ) : (
              <PolaroidCard
                src={photo.url}
                alt={photo.caption ?? "Photo 1"}
                caption={photo.caption}
                priority
                className="w-full"
              />
            )}
          </div>
        </div>
      );
    }

    const currentIndex = Math.min(index, photos.length - 1);
    const wrap = (offset: number) =>
      (((currentIndex + offset) % photos.length) + photos.length) %
      photos.length;

    const tuple: string[] = [];
    for (let offset = 0; offset < 4; offset++) {
      const id = photos[wrap(offset)].id;
      if (!tuple.includes(id)) tuple.push(id);
    }
    const photoById = new Map(photos.map((photo) => [photo.id, photo]));

    const cardClass =
      "block w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-deeprose";

    return (
      <div className={`relative flex flex-col items-center gap-5 ${className}`}>
        <div className="relative w-40 sm:w-56 lg:w-64">
          <AnimatePresence>
            {tuple.map((id, slot) => {
              const photo = photoById.get(id)!;
              const target = geometry.rest[slot];
              const isTop = slot === 0;
              return (
                <motion.div
                  key={id}
                  className={
                    isTop
                      ? "relative grid"
                      : "pointer-events-none absolute inset-0 grid place-items-center"
                  }
                  initial={isTop ? geometry.inTop : target}
                  animate={target}
                  exit={isTop ? geometry.outTop : geometry.outBack}
                  transition={transition}
                  style={{ zIndex: target.zIndex ?? 0 }}
                >
                  {isTop ? (
                    onActivate ? (
                      <button
                        type="button"
                        onClick={() => onActivate(photo, currentIndex)}
                        aria-label={`Open photo ${currentIndex + 1}${
                          photo.caption ? ` — ${photo.caption}` : ""
                        } in a lightbox`}
                        className={cardClass}
                      >
                        <PolaroidCard
                          src={photo.url}
                          alt={photo.caption ?? `Photo ${currentIndex + 1}`}
                          caption={photo.caption}
                          priority
                          className="w-full"
                        />
                      </button>
                    ) : (
                      <PolaroidCard
                        src={photo.url}
                        alt={photo.caption ?? `Photo ${currentIndex + 1}`}
                        caption={photo.caption}
                        priority
                        className="w-full"
                      />
                    )
                  ) : (
                    <PolaroidCard src={photo.url} alt="" className="w-full" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

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
        </div>

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
      </div>
    );
  }
);

export default PolaroidDeck;