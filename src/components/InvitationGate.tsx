"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrushHeart } from "@/components/Ornaments";
import { inviteAlreadyOpened, markInviteOpened } from "@/lib/invite";

type InvitationGateProps = {
  first: string;
  second: string;
  guestName?: string;
};

type Stage = "sealed" | "opening";

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function InvitationGate({
  first,
  second,
  guestName,
}: InvitationGateProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("sealed");
  const timeouts = useRef<number[]>([]);

  // Returning visitors: remove the gate before first paint (no exit animation).
  useIsoLayoutEffect(() => {
    if (inviteAlreadyOpened()) {
      setOpen(true);
      return;
    }
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const pending = timeouts.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function handleOpen() {
    markInviteOpened();
    if (guestName) {
      try {
        void fetch("/api/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: guestName }),
          keepalive: true,
        });
      } catch {
        // Tracking is best-effort only.
      }
    }
    document.documentElement.style.overflow = "";
    setOpen(true);
    window.dispatchEvent(new Event("invite:open"));
  }

  function breakSeal() {
    if (stage !== "sealed") return;
    if (reduceMotion) {
      handleOpen();
      return;
    }
    setStage("opening");
    timeouts.current.push(window.setTimeout(handleOpen, 2150));
  }

  const initials = `${first[0] ?? ""}&${second[0] ?? ""}`;
  const opening = stage === "opening";

  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          key="gate"
          className="fixed inset-0 z-50 overflow-y-auto px-4 py-10 text-center"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, var(--t-bg) 88%, white), var(--t-bg) 55%, color-mix(in srgb, var(--t-bg) 90%, var(--t-accent)))",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-7">
          <motion.p
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: "easeOut" }}
            className="inline-block px-2 py-[0.35em] font-script text-4xl leading-none text-gradient drop-shadow-sm sm:text-5xl"
          >
            You are invited
          </motion.p>

          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.9, ease: "easeOut" }}
          >
            {guestName ? (
              <p className="text-sm tracking-wide text-charcoal/80">
                Dear,{" "}
                <span className="font-serif text-xl italic text-wine">
                  {guestName}
                </span>
              </p>
            ) : null}

            <motion.button
              type="button"
              onClick={breakSeal}
              disabled={opening}
              aria-label="Break the wax seal and open the invitation"
              className="relative block w-[19rem] max-w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-dusty"
              style={{ perspective: 1200, maxWidth: "min(19rem, 69svh)" }}
              whileHover={!opening ? { y: -4 } : undefined}
              whileTap={!opening ? { y: -1 } : undefined}
            >
              <div className="relative aspect-[5/4]">
                {/* Envelope body back panel — y30% → bottom */}
                <div
                  className="absolute inset-x-0 top-[30%] bottom-0 z-0 rounded-2xl border border-white/40 shadow-xl shadow-wine/15"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--t-panel) 88%, var(--t-accent))",
                  }}
                />

                {/* Slot shadow — dark slit where the letter exits */}
                <div
                  aria-hidden
                  className="absolute inset-x-3 top-[30%] z-[5] h-1.5 rounded-full bg-black/25 blur-[3px]"
                />

                {/* Letter card — hidden inside when sealed, slides up out of the slot */}
                <motion.div
                  className="absolute inset-x-4 top-[32%] z-10 flex h-[60%] flex-col items-center gap-1 rounded-xl bg-[var(--t-panel)] px-4 pt-2.5 text-center shadow-md"
                  initial={false}
                  animate={opening ? { y: "-73%" } : { y: 0 }}
                  transition={
                    opening
                      ? {
                          delay: 1.05,
                          duration: 0.9,
                          ease: [0.34, 1.56, 0.64, 1],
                        }
                      : { duration: 0 }
                  }
                >
                  <BrushHeart className="h-4 w-auto text-deeprose/70" />
                  <p className="whitespace-nowrap font-script text-3xl leading-snug text-gradient sm:text-4xl">
                    {first} <span className="font-sans text-sm">&amp;</span>{" "}
                    {second}
                  </p>
                </motion.div>

                {/* Pocket front — V notch dipping just past the flap tip */}
                <div className="absolute inset-x-0 top-[30%] bottom-0 z-20">
                  <svg
                    viewBox="0 0 304 170"
                    preserveAspectRatio="none"
                    aria-hidden
                    className="block h-full w-full"
                  >
                    <path
                      d="M 13 6 L 152 74 L 291 6 Q 304 0 304 14 L 304 154 Q 304 170 288 170 L 16 170 Q 0 170 0 154 L 0 14 Q 0 0 13 6 Z"
                      fill="color-mix(in srgb, var(--t-panel) 94%, var(--t-accent))"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Flap — hinged at the body top edge, folds up behind */}
                <motion.div
                  className="absolute inset-x-0 top-[30%] z-30 h-[30%]"
                  style={{
                    transformOrigin: "top center",
                    backfaceVisibility: "hidden",
                    filter:
                      "drop-shadow(0 4px 4px color-mix(in srgb, var(--t-heading) 35%, transparent))",
                  }}
                  initial={false}
                  animate={{ rotateX: opening ? -170 : 0 }}
                  transition={{
                    duration: 0.85,
                    ease: "easeInOut",
                    delay: opening ? 0.25 : 0,
                  }}
                >
                  <svg
                    viewBox="0 0 304 73"
                    preserveAspectRatio="none"
                    aria-hidden
                    className="block h-full w-full"
                  >
                    <defs>
                      <linearGradient id="gate-flap-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="color-mix(in srgb, var(--t-accent-strong) 82%, black)"
                        />
                        <stop offset="100%" stopColor="var(--t-accent)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 16 0 L 288 0 Q 304 0 304 16 L 152 73 L 0 16 Q 0 0 16 0 Z"
                      fill="url(#gate-flap-fill)"
                    />
                    <line
                      x1="17"
                      y1="0.75"
                      x2="287"
                      y2="0.75"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1"
                    />
                  </svg>
                </motion.div>

                {/* One-shot ripple ring on tap */}
                {opening && (
                  <motion.div
                    aria-hidden
                    className="absolute left-1/2 top-[57%] z-[39] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-deeprose"
                    initial={{ opacity: 0.75, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.9 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                )}

                {/* Wax seal — bridges flap tip / pocket apex junction */}
                <motion.div
                  className="absolute left-1/2 top-[57%] z-40 -translate-x-1/2 -translate-y-1/2"
                  initial={false}
                  animate={
                    opening
                      ? { opacity: 0, scale: 0.3, rotate: 28 }
                      : { opacity: 1, scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.45, ease: "easeIn" }}
                >
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg shadow-wine/30 ring-4 ring-white/25"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--t-accent) 55%, white), var(--t-accent-strong))",
                    }}
                  >
                    <span className="font-script text-2xl leading-none text-white/95">
                      {initials}
                    </span>
                  </span>
                </motion.div>
              </div>
            </motion.button>

            <div className="flex min-h-[2rem] flex-col items-center gap-2">
              {stage === "sealed" ? (
                <>
                  <p className="text-xs uppercase tracking-[0.25em] text-charcoal/60">
                    Tap the seal to open
                  </p>
                  <p className="text-xs text-charcoal/55">
                    Best experienced with sound on
                  </p>
                </>
              ) : null}
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
