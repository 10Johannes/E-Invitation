"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, useState } from "react";

type Anchor = { t: number; x: number; y: number; a: number; s: number };

const LEAVES: Anchor[] = [
  { t: 0.06, x: 72, y: 52, a: -35, s: 0.9 },
  { t: 0.13, x: 44, y: 128, a: 210, s: 1 },
  { t: 0.2, x: 74, y: 206, a: -25, s: 0.85 },
  { t: 0.27, x: 36, y: 296, a: 205, s: 1.05 },
  { t: 0.34, x: 76, y: 376, a: -40, s: 0.9 },
  { t: 0.41, x: 42, y: 458, a: 195, s: 1 },
  { t: 0.48, x: 72, y: 540, a: -30, s: 0.95 },
  { t: 0.55, x: 40, y: 622, a: 215, s: 1.05 },
  { t: 0.62, x: 74, y: 700, a: -35, s: 0.85 },
  { t: 0.69, x: 44, y: 782, a: 200, s: 1 },
  { t: 0.76, x: 72, y: 862, a: -28, s: 0.95 },
  { t: 0.83, x: 46, y: 936, a: 210, s: 0.9 },
];

const VINE_PATH =
  "M60 -10 C30 80 88 170 56 258 C30 332 90 424 58 502 C32 578 86 668 56 756 C34 834 84 912 58 1006";

function Leaf({
  progress,
  anchor,
}: {
  progress: MotionValue<number>;
  anchor: Anchor;
}) {
  const appear = useTransform(
    progress,
    [anchor.t, Math.min(anchor.t + 0.09, 1)],
    [0, 1]
  );
  const springAppear = useSpring(appear, { stiffness: 120, damping: 15 });

  return (
    <motion.g
      style={{
        x: anchor.x,
        y: anchor.y,
        rotate: anchor.a,
        scale: springAppear,
        opacity: springAppear,
      }}
    >
      <g className="vine-sway" style={{ animationDelay: `${anchor.t * 6}s` }}>
        <path
          d="M0 0 C7 -9 18 -9 24 0 C18 9 7 9 0 0 Z"
          fill="var(--vine-leaf)"
          transform={`scale(${anchor.s})`}
          opacity={0.85}
        />
      </g>
    </motion.g>
  );
}

function VineSvg({ side }: { side: "left" | "right" }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 55, damping: 18 });
  const tendrilProgress = useTransform(progress, [0.08, 1], [0, 1]);

  return (
    <svg
      viewBox="0 0 100 1000"
      aria-hidden
      className={`absolute inset-y-0 h-full ${
        side === "left" ? "left-0" : "right-0"
      } origin-top transition-transform ${
        side === "left" ? "" : "-scale-x-100"
      } scale-[0.65] opacity-75 sm:scale-90 sm:opacity-90 lg:scale-100 lg:opacity-100`}
      fill="none"
    >
      <motion.path
        d={VINE_PATH}
        stroke="var(--vine-stem)"
        strokeWidth={3}
        strokeLinecap="round"
        initial={false}
        style={{ pathLength: reduceMotion ? 1 : progress }}
        opacity={0.9}
      />
      <motion.path
        d="M58 -10 C44 120 74 260 54 400 C38 520 80 660 60 800 C50 880 66 950 62 1010"
        stroke="var(--vine-stem)"
        strokeWidth={1.4}
        strokeLinecap="round"
        initial={false}
        style={{ pathLength: reduceMotion ? 1 : tendrilProgress }}
        opacity={0.4}
      />
      {LEAVES.map((anchor) => (
        <Leaf key={`${side}-${anchor.t}`} progress={progress} anchor={anchor} />
      ))}
    </svg>
  );
}

type Blossom = { id: number; yPct: number; side: "left" | "right" };

function Blossom({ yPct, side }: { yPct: number; side: "left" | "right" }) {
  return (
    <motion.div
      aria-hidden
      className={`absolute w-7 ${side === "left" ? "left-3" : "right-3"}`}
      style={{ top: `${yPct}%` }}
      initial={{ scale: 0, rotate: -30, opacity: 0 }}
      animate={{ scale: [0, 1.15, 1], rotate: 0, opacity: 1 }}
      exit={{
        opacity: 0,
        y: -48,
        scale: 0.5,
        transition: { duration: 0.8, ease: "easeIn" },
      }}
      transition={{
        scale: { duration: 0.5, ease: "easeOut" },
        rotate: { duration: 0.5 },
        opacity: { duration: 0.3 },
      }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 drop-shadow-sm">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="16"
            cy="8.5"
            rx="4.2"
            ry="7"
            fill="var(--t-accent)"
            opacity={0.92}
            transform={`rotate(${deg} 16 16)`}
          />
        ))}
        <circle cx="16" cy="16" r="3.4" fill="var(--t-accent-strong)" />
      </svg>
    </motion.div>
  );
}

export default function Vines() {
  const reduceMotion = useReducedMotion();
  const idRef = useRef(0);
  const [blossoms, setBlossoms] = useState<Blossom[]>([]);

  function bloom(side: "left" | "right", clientY: number) {
    if (reduceMotion) return;
    const blossom: Blossom = {
      id: ++idRef.current,
      yPct: (clientY / window.innerHeight) * 100,
      side,
    };
    setBlossoms((prev) => [...prev.slice(-10), blossom]);
    window.setTimeout(() => {
      setBlossoms((prev) => prev.filter((b) => b.id !== blossom.id));
    }, 3800);
  }

  return (
    <>
      <div aria-hidden className="vines pointer-events-none fixed inset-0 z-[1]">
        <VineSvg side="left" />
        <VineSvg side="right" />
      </div>

      {!reduceMotion && (
        <>
          <div
            aria-hidden
            className="fixed inset-y-0 left-0 z-[1] w-12 cursor-pointer"
            onClick={(e) => bloom("left", e.clientY)}
          />
          <div
            aria-hidden
            className="fixed inset-y-0 right-0 z-[1] w-12 cursor-pointer"
            onClick={(e) => bloom("right", e.clientY)}
          />
          <div className="pointer-events-none fixed inset-0 z-[2]">
            <AnimatePresence>
              {blossoms.map((blossom) => (
                <Blossom
                  key={blossom.id}
                  yPct={blossom.yPct}
                  side={blossom.side}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </>
  );
}
