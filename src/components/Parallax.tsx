"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useSmoothScrollY } from "./ScrollDepthProvider";

type ParallaxProps = {
  children: ReactNode;
  /** Fraction of scroll speed retained. Positive values appear slower than content. */
  speed?: number;
  /** Extra degrees of tilt accumulated per 1200px of scroll. */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
};

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

  const y = useTransform(scrollY, (value) => value * speed);
  const r = useTransform(scrollY, (value) => value * (rotate / 1200));

  if (reduceMotion) {
    return (
      <div className={className} style={style} aria-hidden={ariaHidden}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{ ...style, y, rotate: r }}
      aria-hidden={ariaHidden}
    >
      {children}
    </motion.div>
  );
}
