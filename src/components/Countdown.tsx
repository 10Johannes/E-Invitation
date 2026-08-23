"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diff(target: Date): Parts | null {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

export default function Countdown({ dateISO }: { dateISO: string }) {
  // undefined = not mounted yet (avoids hydration mismatch)
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    const target = new Date(dateISO);
    const tick = () => setParts(diff(target));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [dateISO]);

  if (parts === undefined) {
    return <div className="h-20" aria-hidden />;
  }

  if (parts === null) {
    return (
      <p className="glass rounded-full px-8 py-4 font-serif text-2xl italic text-wine">
        Just married!
      </p>
    );
  }

  const cells = [
    { label: "Days", value: parts.days },
    { label: "Hours", value: parts.hours },
    { label: "Minutes", value: parts.minutes },
    { label: "Seconds", value: parts.seconds },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-5" role="timer" aria-label="Countdown to the wedding">
      {cells.map((cell) => (
        <div key={cell.label} className="glass min-w-[4.5rem] rounded-2xl px-4 py-3 text-center">
          <div className="font-serif text-3xl font-semibold tabular-nums text-wine">
            {cell.value}
          </div>
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-charcoal/70">
            {cell.label}
          </div>
        </div>
      ))}
    </div>
  );
}
