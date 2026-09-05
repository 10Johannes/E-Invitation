"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// --- Spotify Iframe API types (used only for the playlist fallback) ---
type SpotifyIFrameAPI = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyController) => void
  ) => void;
};

type SpotifyController = {
  addListener: (
    event: string,
    callback: (event: { data: unknown }) => void
  ) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
    __spotifyIframeApiPromise?: Promise<SpotifyIFrameAPI>;
  }
}

function loadSpotifyIframeApi(): Promise<SpotifyIFrameAPI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (!window.__spotifyIframeApiPromise) {
    window.__spotifyIframeApiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = resolve;
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return window.__spotifyIframeApiPromise;
}

type VinylPlayerProps = {
  playlistUrl: string;
  audioUrls: string[];
  first: string;
  second: string;
};

const EQ_DELAYS = ["0s", "0.15s", "0.3s", "0.45s", "0.6s"];

function isNotAllowedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "NotAllowedError"
  );
}

export default function VinylPlayer({
  playlistUrl,
  audioUrls,
  first,
  second,
}: VinylPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [nudged, setNudged] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackIndexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const wantPlayRef = useRef(false);

  const playlistId = playlistUrl.match(/playlist\/([A-Za-z0-9]+)/)?.[1];
  const tracks = audioUrls.filter((url) => Boolean(url.trim()));
  const hasAudio = tracks.length > 0;

  // Which engine actually drives playback. Falls back to Spotify when the
  // audio file errors out, but keeps retrying the file when there is no
  // playlist to fall back to.
  const source: "audio" | "spotify" | "none" =
    hasAudio && (!audioFailed || !playlistId)
      ? "audio"
      : playlistId
        ? "spotify"
        : "none";

  // --- Native <audio> path (preferred: reliable autoplay) ---
  useEffect(() => {
    if (!hasAudio) return;
    const urls = audioUrls.filter((url) => Boolean(url.trim()));
    setAudioFailed(false);
    const audio = audioRef.current;
    if (!audio || urls.length === 0) return;
    audio.preload = "auto";
    trackIndexRef.current = 0;
    // Set the src imperatively once at mount so React's re-renders never
    // fight the "advance to next track" mutation in onEnded below.
    audio.src = urls[0];
    const onPlay = () => {
      setPlaying(true);
      setNudged(true);
    };
    const onPause = () => setPlaying(false);
    const markFailed = () => {
      console.warn("[VinylPlayer] audio failed to load", urls);
      setPlaying(false);
      setAudioFailed(true);
    };
    const onEnded = () => {
      const next = (trackIndexRef.current + 1) % urls.length;
      trackIndexRef.current = next;
      // Changing src re-runs the load algorithm, so a single track still
      // loops via advance → same URL.
      audio.src = urls[next];
      audio.play().catch(() => {
        // If the continued playback is blocked, the visible play button is
        // the reliable gesture.
      });
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", markFailed);
    audio.addEventListener("abort", markFailed);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", markFailed);
      audio.removeEventListener("abort", markFailed);
      audio.removeEventListener("ended", onEnded);
    };
  }, [hasAudio, audioUrls]);

  // --- Spotify Iframe API path (fallback when no audio file) ---
  useEffect(() => {
    if (source !== "spotify") return;
    let disposed = false;

    loadSpotifyIframeApi().then((api) => {
      if (disposed || !containerRef.current) return;
      api.createController(
        containerRef.current,
        {
          uri: `spotify:playlist:${playlistId}`,
          width: "100%",
          height: 152,
        },
        (controller) => {
          if (disposed) return;
          controllerRef.current = controller;
          controller.addListener("playback_update", (event) => {
            const data = event.data as { isPaused?: boolean } | undefined;
            const isPlaying = Boolean(data && data.isPaused === false);
            setPlaying(isPlaying);
            if (isPlaying) setNudged(true);
          });
          if (wantPlayRef.current) controller.play();
        }
      );
    });

    return () => {
      disposed = true;
      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [playlistId, source]);

  // --- Start playback on envelope open ---
  useEffect(() => {
    function playAudioWithRetry() {
      const audio = audioRef.current;
      if (!audio) return;
      let stopped = false;
      let interval = 0;
      const stop = () => {
        stopped = true;
        window.clearInterval(interval);
      };
      const attempt = () => {
        if (stopped) return;
        // Play directly inside the click-gesture task; native audio accepts
        // this far more reliably than the Spotify iframe bridge. Retry for a
        // short window in case the metadata was still buffering.
        audio.play().catch((error) => {
          if (stopped) return;
          // Gesture-blocked play is expected on some browsers — the visible
          // play button is the reliable gesture, so don't treat it as failure.
          if (isNotAllowedError(error)) return;
          if (playlistId) setAudioFailed(true);
        });
      };
      attempt();
      interval = window.setInterval(attempt, 150);
      audio.addEventListener("playing", stop, { once: true });
      audio.addEventListener("pause", stop, { once: true });
      window.setTimeout(stop, 1500);
    }

    function onOpen() {
      wantPlayRef.current = true;
      setNudged(true);
      if (source === "audio") {
        playAudioWithRetry();
        return;
      }
      if (source !== "spotify") return;
      controllerRef.current?.play();
      // The Spotify controller may still be initializing at the moment of the
      // click. Retry for a short window so the play call lands while the
      // browser still counts it as a user-initiated gesture.
      const interval = window.setInterval(() => {
        if (controllerRef.current) {
          controllerRef.current.play();
          window.clearInterval(interval);
        }
      }, 150);
      window.setTimeout(() => window.clearInterval(interval), 1500);
    }
    window.addEventListener("invite:open", onOpen);
    return () => window.removeEventListener("invite:open", onOpen);
  }, [source, playlistId]);

  function toggle() {
    const audio = audioRef.current;
    if (source === "audio" && audio) {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }
    const controller = controllerRef.current;
    if (!controller) {
      wantPlayRef.current = true;
      return;
    }
    wantPlayRef.current = true;
    controller.togglePlay();
  }

  if (!playlistId && !hasAudio) {
    return (
      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
          <div
            className="vinyl relative h-40 w-40 shrink-0 rounded-full opacity-70"
            aria-hidden
          >
            <span className="absolute inset-2 rounded-full border border-white/10 opacity-60" />
            <span className="absolute inset-5 rounded-full border border-white/10 opacity-50" />
            <span className="absolute inset-8 rounded-full border border-white/10 opacity-40" />
            <span
              className="absolute inset-11 flex items-center justify-center rounded-full font-serif text-lg italic text-white/95 shadow-inner"
              style={{ backgroundImage: "var(--grad-accent)" }}
            >
              {first[0]}&amp;{second[0]}
            </span>
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--t-panel)]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-wine/70">
              Now spinning
            </p>
            <h3 className="mt-3 font-serif text-2xl italic text-gradient sm:text-3xl">
              {first} &amp; {second}&apos;s Playlist
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
              Our playlist is coming soon — check back before the big day ♪
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-shimmer rounded-3xl bg-[linear-gradient(120deg,var(--t-accent),var(--t-panel),var(--t-accent))] bg-[length:220%_220%] p-px shadow-xl shadow-wine/10">
      <div className="glass rounded-[calc(1.5rem-1px)] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
          <div className="relative shrink-0">
            <motion.div
              className="vinyl relative h-40 w-40 rounded-full"
              animate={playing ? { rotate: 360 } : { rotate: 0 }}
              transition={
                playing
                  ? { duration: 6, ease: "linear", repeat: Infinity }
                  : { duration: 0.5 }
              }
            >
              <span className="absolute inset-2 rounded-full border border-white/10 opacity-60" />
              <span className="absolute inset-5 rounded-full border border-white/10 opacity-50" />
              <span className="absolute inset-8 rounded-full border border-white/10 opacity-40" />
              <span
                className="absolute inset-11 flex items-center justify-center rounded-full font-serif text-lg italic text-white/95 shadow-inner"
                style={{ backgroundImage: "var(--grad-accent)" }}
              >
                {first[0]}&amp;{second[0]}
              </span>
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--t-panel)]" />
            </motion.div>

            <motion.div
              className="absolute -right-4 -top-4 z-10 h-16 w-16"
              style={{ originX: 0.82, originY: 0.18 }}
              animate={{ rotate: playing ? 8 : -30 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" className="text-charcoal/60">
                <circle cx="50" cy="12" r="6" fill="currentColor" stroke="none" />
                <path d="M46 17 C 34 30, 22 38, 14 54" strokeLinecap="round" />
                <rect x="8" y="50" width="12" height="8" rx="3" fill="currentColor" stroke="none" />
              </svg>
            </motion.div>
          </div>

          <div className="flex flex-1 flex-col items-center gap-4 text-center sm:items-start sm:text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-wine/70">
              Now spinning
            </p>
            <h3 className="font-serif text-2xl italic text-gradient sm:text-3xl">
              {first} &amp; {second}&apos;s Playlist
            </h3>

            <div className="flex h-6 items-end gap-1.5" aria-hidden>
              {EQ_DELAYS.map((delay, i) => (
                <span
                  key={delay}
                  className={`w-1 origin-bottom rounded-full ${playing ? "animate-eq" : ""}`}
                  style={{
                    height: `${10 + ((i * 5) % 14)}px`,
                    animationDelay: delay,
                    backgroundImage: "var(--grad-accent)",
                    transform: playing ? undefined : "scaleY(0.35)",
                    transition: "transform .4s ease",
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={toggle}
              className={`btn-primary mt-1 flex h-12 w-12 items-center justify-center rounded-full text-base ${
                playing || nudged ? "" : "animate-pulse-ring"
              }`}
              aria-label={playing ? "Pause playlist" : "Play playlist"}
            >
              {playing ? "❚❚" : "▶"}
            </button>

            {hasAudio && audioFailed ? (
              <p className="text-xs text-charcoal/60">
                {playlistId
                  ? "The music file had trouble loading — playing Spotify instead."
                  : "The music file had trouble loading — tap play to retry."}
              </p>
            ) : !hasAudio ? (
              <p className="text-xs text-charcoal/60">
                Full tracks need a free Spotify login.
              </p>
            ) : null}
          </div>
        </div>

        {source === "audio" ? (
          <audio
            ref={audioRef}
            preload="auto"
            className="hidden"
          />
        ) : (
          <motion.div
            initial={false}
            animate={{
              height: playing ? 152 : 0,
              opacity: playing ? 1 : 0,
              marginTop: playing ? 24 : 0,
            }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="overflow-hidden"
            aria-hidden={!playing}
          >
            {/* The embed must keep a real layout size so the Spotify iframe
                initializes and accepts play(); only the outer box collapses. */}
            <div className="h-[152px]">
              <div ref={containerRef} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
