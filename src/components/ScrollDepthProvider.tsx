"use client";

import { useScroll, useSpring, type MotionValue } from "framer-motion";
import { createContext, useContext, type ReactNode } from "react";

const SmoothScrollContext = createContext<MotionValue<number> | null>(null);

export function ScrollDepthProvider({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 60,
    damping: 20,
    mass: 0.9,
  });

  return (
    <SmoothScrollContext.Provider value={smoothScrollY}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScrollY(): MotionValue<number> {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    throw new Error("useSmoothScrollY must be used within ScrollDepthProvider");
  }
  return context;
}
