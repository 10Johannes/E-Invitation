"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useSmoothScrollY } from "./ScrollDepthProvider";

type ParallaxProps = {
  children: ReactNode;
  /** Fraction of scroll speed retained. Positive values appear slower than content. */
  speed?: number;
  /** Extra degrees of tilt accumulated per 1200px of scrolled travel. */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
};

/** Hard ceiling so decorations can never wander far from their section. */
const MAX_DRIFT_PX = 420;

export default function Parallax({
  children,
  speed = 0.3,
  rotate = 0,
  className,
  style,
  "aria-hidden": ariaHidden,
}: ParallaxProps) {
  const reduceMotion = useReducedMotion();
  const scrollY = useSmoothScrollY();
  const ref = useRef<HTMLDivElement>(null);
  const [entryPoint, setEntryPoint] = useState(0);

  /**
   * Drift is measured relative to this element's own position (its top
   * crossing the lower third of the viewport), NOT absolute scroll — the old
   * `scrollY * speed` maths pushed absolutely-positioned floats thousands of
   * pixels away from their sections on long pages.
   */
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const node = ref.current;
      if (!node || typeof window === "undefined") return;
      const rectTop =
        node.getBoundingClientRect().top + (window.scrollY ?? window.pageYOffset);
      setEntryPoint(rectTop - window.innerHeight * 0.66);
    };
    measure();
    const timers = [
      window.setTimeout(measure, 350),
      window.setTimeout(measure, 1200),
    ];
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(frame);
    };
  }, []);

  const y = useTransform(scrollY, (value) =>
    Math.max(
      -MAX_DRIFT_PX,
      Math.min(MAX_DRIFT_PX, (value - entryPoint) * speed)
    )
  );
  const r = useTransform(scrollY, (value) => ((value - entryPoint) * rotate) / 1200);

  if (reduceMotion) {
    return (
      <div className={className} style={style} aria-hidden={ariaHidden}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, y, rotate: r }}
      aria-hidden={ariaHidden}
    >
      {children}
    </motion.div>
  );
}
