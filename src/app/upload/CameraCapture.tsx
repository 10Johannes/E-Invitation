"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FacingMode = "environment" | "user";

type CameraCaptureProps = {
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallback?: () => void;
};

export default function CameraCapture({
  onClose,
  onCapture,
  onFallback,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<FacingMode>("environment");
  const [error, setError] = useState<string | null>(null);
  const [shooting, setShooting] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "This browser can't open the camera here — it needs a secure (HTTPS) connection."
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        stopStream();
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === "NotAllowedError") {
          setError(
            "Camera access was blocked. Allow it in your browser settings and try again."
          );
        } else {
          setError("We couldn't find a usable camera on this device.");
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, stopStream]);

  function shoot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || shooting) return;
    setShooting(true);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        setShooting(false);
        if (!blob) return;
        onCapture(
          new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" })
        );
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Camera"
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
    >
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-white/85">{error}</p>
          {onFallback && (
            <button
              type="button"
              onClick={onFallback}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/85"
            >
              Use camera app instead
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/30 px-6 py-2.5 text-sm text-white/90 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`flex-1 w-full object-cover ${
              facing === "user" ? "scale-x-[-1]" : ""
            }`}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-xl text-white/90 backdrop-blur transition hover:bg-black/70"
          >
            ✕
          </button>

          <div className="flex items-center justify-center gap-10 py-7">
            <button
              type="button"
              aria-label="Switch camera"
              onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-lg text-white/90 transition hover:bg-white/25"
            >
              ⟳
            </button>
            <button
              type="button"
              aria-label="Take photo"
              onClick={shoot}
              disabled={shooting}
              className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-white/90 transition active:scale-95 disabled:opacity-60"
            >
              <span className="h-13 w-13 rounded-full bg-white/95" />
            </button>
            <span className="h-12 w-12" aria-hidden />
          </div>
        </>
      )}
    </div>
  );
}
