"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CameraCapture from "./CameraCapture";

const MAX_FILES = 20;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadClientProps = {
  first: string;
  second: string;
  hint: string;
};

type Status = "queued" | "compressing" | "uploading" | "done" | "error";
type Phase = "gate" | "ready" | "uploading" | "complete";

type Item = {
  id: string;
  file: File;
  previewUrl: string;
  status: Status;
  progress: number;
  error?: string;
};

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function UploadClient({
  first,
  second,
  hint,
}: UploadClientProps) {
  const [phase, setPhase] = useState<Phase>("gate");
  const [passcode, setPasscode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Keep a mirror of items for stable access inside async callbacks
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  function addFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return;
    setFormError(null);

    const added: Item[] = [];
    for (const file of Array.from(fileList)) {
      if (itemsRef.current.length + added.length >= MAX_FILES) {
        setFormError(`You can share up to ${MAX_FILES} photos.`);
        break;
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        setFormError("Some files were skipped — please choose JPEG, PNG or WebP images.");
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setFormError(`"${file.name}" is larger than ${MAX_SIZE_MB} MB and was skipped.`);
        continue;
      }
      added.push({
        id: newId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        progress: 0,
      });
    }

    if (added.length > 0) {
      setItems((prev) => [...prev, ...added]);
      setPhase("ready");
    }
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }

  const uploadOne = useCallback(
    async (item: Item) => {
      updateItem(item.id, { status: "compressing", progress: 0, error: undefined });

      const imageCompression = (await import("browser-image-compression")).default;
      const compressed = await imageCompression(item.file, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        onProgress: (ratio) =>
          updateItem(item.id, { progress: Math.round(ratio * 40) }),
      });

      updateItem(item.id, { status: "uploading", progress: 45 });

      const form = new FormData();
      form.set("passcode", passcode.trim());
      form.set("guestName", guestName.trim());
      form.set(
        "file",
        compressed,
        item.file.name.replace(/\.[^.]+$/, "") + ".jpg"
      );

      const response = await fetch("/api/upload", { method: "POST", body: form });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `Upload failed (${response.status})`);
      }

      updateItem(item.id, { status: "done", progress: 100 });
    },
    [guestName, passcode, updateItem]
  );

  async function runQueue() {
    setPhase("uploading");
    const queue = itemsRef.current.filter(
      (it) => it.status === "queued" || it.status === "error"
    );
    for (const item of queue) {
      try {
        await uploadOne(item);
      } catch (error) {
        updateItem(item.id, {
          status: "error",
          error:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      }
    }
    setPhase("complete");
  }

  function confirmDetails(target: "picker" | "camera") {
    if (!passcode.trim()) {
      setFormError("Please enter your event code.");
      return;
    }
    setFormError(null);
    openCameraOrPicker(target);
  }

  function openCameraOrPicker(target: "picker" | "camera") {
    if (target === "camera") {
      // In-page viewfinder where the browser allows it; native camera app
      // (capture attribute) as fallback on insecure origins.
      if (
        typeof window !== "undefined" &&
        typeof navigator.mediaDevices?.getUserMedia === "function"
      ) {
        setCameraOpen(true);
      } else {
        cameraInputRef.current?.click();
      }
      return;
    }
    inputRef.current?.click();
  }

  const doneCount = items.filter((it) => it.status === "done").length;
  const errorCount = items.filter((it) => it.status === "error").length;
  const pendingCount = items.filter(
    (it) => it.status === "queued" || it.status === "error"
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-wine/80">
          {first} &amp; {second}
        </p>
        <h1 className="mt-2 font-serif text-4xl italic text-wine">Share Your Photos</h1>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
          Add the pictures you took today — they may appear in the couple&apos;s gallery.
        </p>
      </header>

      {/* Hidden inputs live outside phase conditionals so every stage can open them */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => {
            setCameraOpen(false);
            addFiles([file]);
          }}
          onFallback={() => {
            setCameraOpen(false);
            cameraInputRef.current?.click();
          }}
        />
      )}

      {phase === "gate" && (
        <section className="glass rounded-3xl p-7">
          <label className="block text-sm font-medium text-charcoal">
            Event code
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter your code"
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-charcoal/10 bg-charcoal/5 px-4 py-3 text-base text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-deeprose focus:bg-charcoal/10"
            />
          </label>
          <p className="mt-2 text-xs text-charcoal/55">
            Find it on {hint}.
          </p>

          <label className="mt-5 block text-sm font-medium text-charcoal">
            Your name{" "}
            <span className="font-normal text-charcoal/50">(optional)</span>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="So the couple knows who to thank"
              maxLength={60}
              className="mt-2 w-full rounded-xl border border-charcoal/10 bg-charcoal/5 px-4 py-3 text-base text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-deeprose focus:bg-charcoal/10"
            />
          </label>

          {formError && (
            <p role="alert" className="mt-4 text-sm text-deeprose">
              {formError}
            </p>
          )}

          <button
            type="button"
            onClick={() => confirmDetails("picker")}
            className="mt-6 w-full rounded-full bg-wine px-8 py-3.5 text-sm font-medium tracking-wide text-ivory transition hover:bg-deeprose"
          >
            Choose Photos
          </button>
          <button
            type="button"
            onClick={() => confirmDetails("camera")}
            className="mt-3 w-full rounded-full border border-wine/30 px-8 py-3 text-sm text-wine transition hover:bg-wine/5"
          >
            Take a Photo
          </button>
        </section>
      )}

      {phase !== "gate" && (
        <section className="glass rounded-3xl p-7">
          {items.length === 0 ? (
            <div className="flex h-44 w-full gap-3">
              <button
                type="button"
                onClick={() => openCameraOrPicker("picker")}
                disabled={phase === "uploading"}
                className="flex h-full w-1/2 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dusty/80 bg-charcoal/[0.03] text-charcoal/70 transition hover:bg-charcoal/[0.07] disabled:opacity-50"
              >
                <span className="font-serif text-lg italic text-wine">Choose Photos</span>
                <span className="text-xs">JPEG or PNG</span>
              </button>
              <button
                type="button"
                onClick={() => openCameraOrPicker("camera")}
                disabled={phase === "uploading"}
                aria-label="Take a photo with the camera"
                className="flex h-full w-1/2 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dusty/80 bg-charcoal/[0.03] text-charcoal/70 transition hover:bg-charcoal/[0.07] disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-6 w-6 text-wine/70"
                  aria-hidden
                >
                  <path d="M8.5 6.5 10 4h4l1.5 2.5" strokeLinecap="round" />
                  <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
                  <circle cx="12" cy="12.75" r="3.25" />
                </svg>
                <span className="font-serif text-lg italic text-wine">Take a Photo</span>
              </button>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                  <li key={item.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt=""
                      className={`aspect-square w-full rounded-xl object-cover ring-offset-2 ${
                        item.status === "error"
                          ? "ring-2 ring-deeprose"
                          : item.status === "done"
                            ? "ring-2 ring-dusty"
                            : ""
                      }`}
                    />
                    {item.status !== "done" && phase !== "uploading" && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.file.name}`}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-wine text-xs text-ivory shadow"
                      >
                        ×
                      </button>
                    )}
                    {(item.status === "compressing" ||
                      item.status === "uploading") && (
                      <div className="absolute inset-x-1 bottom-1 h-1.5 overflow-hidden rounded-full bg-black/25">
                        <div
                          className="h-full bg-ivory transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === "done" && (
                      <div className="absolute inset-0 flex items-end justify-center rounded-xl bg-gradient-to-t from-black/45 to-transparent pb-1.5">
                        <span className="text-[0.65rem] font-medium uppercase tracking-widest text-ivory">
                          Shared
                        </span>
                      </div>
                    )}
                  </li>
                ))}
                {items.length < MAX_FILES && (
                  <li>
                    <button
                      type="button"
                      onClick={() => openCameraOrPicker("picker")}
                      disabled={phase === "uploading"}
                      aria-label="Add more photos"
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-dusty/80 bg-charcoal/[0.03] text-3xl text-wine transition hover:bg-charcoal/[0.07] disabled:opacity-50"
                    >
                      +
                    </button>
                  </li>
                )}
                {items.length < MAX_FILES - 1 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => openCameraOrPicker("camera")}
                      disabled={phase === "uploading"}
                      aria-label="Take a photo with the camera"
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-dusty/80 bg-charcoal/[0.03] text-wine transition hover:bg-charcoal/[0.07] disabled:opacity-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-6 w-6"
                        aria-hidden
                      >
                        <path d="M8.5 6.5 10 4h4l1.5 2.5" strokeLinecap="round" />
                        <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
                        <circle cx="12" cy="12.75" r="3.25" />
                      </svg>
                      <span className="text-[0.6rem] font-medium uppercase tracking-[0.15em]">
                        Take Photo
                      </span>
                    </button>
                  </li>
                )}
              </ul>

              {items.length > 0 && items.length < MAX_FILES && phase !== "uploading" && (
                <button
                  type="button"
                  onClick={() => openCameraOrPicker("camera")}
                  className="mt-4 w-full rounded-full border border-wine/30 px-8 py-3 text-sm text-wine transition hover:bg-wine/5"
                >
                  Take a Photo
                </button>
              )}

              {formError && (
                <p role="alert" className="mt-4 text-sm text-deeprose">
                  {formError}
                </p>
              )}

              {pendingCount > 0 && phase !== "uploading" && (
                <button
                  type="button"
                  onClick={runQueue}
                  className="mt-6 w-full rounded-full bg-wine px-8 py-3.5 text-sm font-medium tracking-wide text-ivory transition hover:bg-deeprose"
                >
                  Share {pendingCount} Photo{pendingCount === 1 ? "" : "s"}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {phase === "complete" && (
        <section className="glass rounded-3xl p-7 text-center">
          <p className="font-serif text-2xl italic text-wine">
            {errorCount === 0
              ? "Thank you for sharing!"
              : `${doneCount} of ${items.length} photos shared`}
          </p>
          {errorCount > 0 && (
            <>
              <p className="mt-2 text-sm text-charcoal/75">
                Some photos could not be uploaded.
              </p>
              <button
                type="button"
                onClick={runQueue}
                className="mt-4 rounded-full bg-wine px-8 py-3 text-sm font-medium tracking-wide text-ivory transition hover:bg-deeprose"
              >
                Try Again
              </button>
            </>
          )}
          <p className="mt-4 text-sm text-charcoal/70">
            <Link href="/" className="underline decoration-dusty underline-offset-4 hover:text-wine">
              Back to the invitation
            </Link>
          </p>
        </section>
      )}

      {phase === "ready" && items.length === 0 && (
        <p className="text-center text-sm text-charcoal/70">
          <Link href="/" className="underline decoration-dusty underline-offset-4 hover:text-wine">
            Back to the invitation
          </Link>
        </p>
      )}

      {phase === "uploading" && (
        <p className="text-center text-sm text-charcoal/70" role="status">
          Uploading — please keep this page open…
        </p>
      )}
    </main>
  );
}
