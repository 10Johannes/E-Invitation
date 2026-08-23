"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BrushHeart } from "@/components/Ornaments";
import { inviteAlreadyOpened } from "@/lib/invite";

type BurstHeart = {
  id: number;
  x: number;
  y: number;
  drift: number;
  scale: number;
  rise: number;
  duration: number;
};

const GROUP = 6;
const MAX_GROUPS = 8;

let seq = 0;

export default function TapHearts() {
  const reduceMotion = useReducedMotion();
  const [hearts, setHearts] = useState<BurstHeart[]>([]);
  const [sent, setSent] = useState<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = Number(window.localStorage.getItem("hearts-sent") || "0");
      setSent(Number.isFinite(stored) ? stored : 0);
    });
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let armed = inviteAlreadyOpened();
    function arm() {
      armed = true;
    }
    window.addEventListener("invite:open", arm);
    function onPointerDown(event: PointerEvent) {
      if (!armed) return;
      const target = event.target as HTMLElement | null;
      if (
        !target ||
        target.closest(
          "a, button, input, textarea, select, label, iframe"
        )
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastRef.current < 120) return;
      lastRef.current = now;

      const baseId = ++seq;
      const fresh: BurstHeart[] = Array.from({ length: GROUP }, (_, i) => ({
        id: baseId * 100 + i,
        x: event.clientX + (Math.random() * 48 - 24),
        y: event.clientY + (Math.random() * 12 - 6),
        drift: Math.random() * 36 - 18,
        scale: 0.7 + Math.random() * 0.7,
        rise: 70 + Math.random() * 60,
        duration: 1.3 + Math.random() * 0.4,
      }));

      setHearts((current) => [
        ...current.slice(-(MAX_GROUPS - 1) * GROUP),
        ...fresh,
      ]);

      window.setTimeout(() => {
        setHearts((current) =>
          current.filter((heart) => heart.id < baseId * 100 || heart.id >= baseId * 100 + GROUP)
        );
      }, 1600);

      setSent((value) => {
        const next = (value ?? 0) + GROUP;
        window.localStorage.setItem("hearts-sent", String(next));
        return next;
      });
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("invite:open", arm);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        <AnimatePresence>
          {hearts.map((heart) => (
            <motion.div
              key={heart.id}
              className="absolute"
              style={{ left: heart.x, top: heart.y }}
              initial={{ opacity: 0, y: 0, scale: heart.scale * 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -heart.rise,
                x: heart.drift,
                rotate: heart.drift * 1.4,
                scale: heart.scale,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: heart.duration, ease: "easeOut" }}
            >
              <BrushHeart className="h-4 w-auto text-deeprose/80 drop-shadow-sm" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {sent !== null && sent > 0 && (
        <div className="fixed bottom-4 left-4 z-30 rounded-full border border-white/50 bg-[var(--t-panel)]/85 px-3 py-1 text-xs text-wine shadow-md">
          ❤ {sent} sent
        </div>
      )}
    </>
  );
}
