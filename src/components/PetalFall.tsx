"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { inviteAlreadyOpened } from "@/lib/invite";

type Petal = {
  x: number;
  y: number;
  size: number;
  fallSpeed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  rot: number;
  rotSpeed: number;
  colorIndex: 0 | 1;
  alpha: number;
};

const COLORS = ["--petal-a", "--petal-b"];

export default function PetalFall() {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const baseCount = mobile ? 8 : 16;
    // Petals stay idle behind the gate; the loop only runs once the
    // invitation has been opened (or for returning visitors).
    let targetCount = 0;

    function readColor(name: string): string {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      return value || "rgba(201, 154, 164, 0.45)";
    }

    let palette = [readColor(COLORS[0]), readColor(COLORS[1])];

    function spawn(anywhere: boolean): Petal {
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -24 - Math.random() * 60,
        size: 6 + Math.random() * 7,
        fallSpeed: 18 + Math.random() * 22,
        swayAmp: 18 + Math.random() * 30,
        swayFreq: 0.4 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.4,
        colorIndex: Math.random() < 0.5 ? 0 : 1,
        alpha: 0.5 + Math.random() * 0.35,
      };
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);

    const petals: Petal[] = [];

    function onOpen() {
      targetCount = baseCount;
      start();
    }
    if (inviteAlreadyOpened()) {
      // Returning visitor: the gate never mounts, so start right away.
      onOpen();
    }
    window.addEventListener("invite:open", onOpen);

    function onVisibility() {
      last = performance.now();
    }
    document.addEventListener("visibilitychange", onVisibility);

    function drawPetal(petal: Petal) {
      const s = petal.size;
      ctx!.save();
      ctx!.translate(petal.x, petal.y);
      ctx!.rotate(petal.rot);
      ctx!.globalAlpha = petal.alpha;
      ctx!.fillStyle = palette[petal.colorIndex];
      ctx!.beginPath();
      ctx!.moveTo(0, -s);
      ctx!.bezierCurveTo(s * 0.9, -s * 0.55, s * 0.75, s * 0.7, 0, s);
      ctx!.bezierCurveTo(-s * 0.75, s * 0.7, -s * 0.9, -s * 0.55, 0, -s);
      ctx!.fill();
      ctx!.restore();
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      ctx!.clearRect(0, 0, width, height);

      for (let i = petals.length - 1; i >= 0; i--) {
        const petal = petals[i];
        petal.y += petal.fallSpeed * dt;
        petal.rot += petal.rotSpeed * dt;
        const x =
          petal.x +
          Math.sin(petal.phase + t * petal.swayFreq) * petal.swayAmp;
        drawPetal({ ...petal, x });
        if (petal.y > height + 30) {
          if (petals.length > targetCount) {
            petals.splice(i, 1);
          } else {
            petals[i] = spawn(false);
            if (petals[i].colorIndex === 0 && Math.random() < 0.02) {
              palette = [readColor(COLORS[0]), readColor(COLORS[1])];
            }
          }
        }
      }
      while (petals.length < targetCount) {
        petals.push(spawn(false));
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      window.removeEventListener("invite:open", onOpen);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5]"
    />
  );
}
