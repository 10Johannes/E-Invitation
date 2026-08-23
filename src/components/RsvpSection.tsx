"use client";

import { useState } from "react";

type RsvpSectionProps = {
  first: string;
  second: string;
};

type Status = "idle" | "sending" | "done";

export default function RsvpSection({ first, second }: RsvpSectionProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attending, setAttending] = useState<"yes" | "no" | "">("");

  async function onSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") || ""),
      attending: formData.get("attending") === "no" ? "no" : "yes",
      guests: Number(formData.get("guests") || 1),
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
    };

    if (!payload.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!formData.get("attending")) {
      setError("Please choose whether you can attend.");
      return;
    }

    setError(null);
    setStatus("sending");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Something went wrong.");
      }
      setStatus("done");
    } catch (submitError) {
      setStatus("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong."
      );
    }
  }

  return (
    <div className="glass mx-auto max-w-xl rounded-3xl p-7 sm:p-9">
      <h3 className="text-center font-script text-4xl text-gradient">
        RSVP
      </h3>
      <p className="mt-2 text-center text-sm uppercase tracking-[0.25em] text-charcoal/60">
        We can&apos;t wait to celebrate with you
      </p>

      {status === "done" ? (
        <div className="mt-7 text-center">
          <p className="font-serif text-2xl italic text-wine">
            Thank you for responding!
          </p>
          <p className="mt-2 text-sm text-charcoal/75">
            Your reply has been received. See you at{" "}
            <span className="font-medium">{first} &amp; {second}</span>
            &apos;s celebration.
          </p>
        </div>
      ) : (
        <form
          className="mt-7 flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(new FormData(event.currentTarget));
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-charcoal/60">
              Your name
            </span>
            <input
              type="text"
              name="name"
              required
              maxLength={80}
              placeholder="Juan & Maria Dela Cruz"
              className="rounded-xl border border-charcoal/15 bg-white/60 px-4 py-2.5 text-sm outline-none transition focus:border-dusty focus:bg-white"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-xs uppercase tracking-[0.2em] text-charcoal/60">
              Will you attend?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(["yes", "no"] as const).map((choice) => (
                <label
                  key={choice}
                  className={`cursor-pointer rounded-xl border px-4 py-2.5 text-center text-sm transition ${
                    attending === choice
                      ? "border-transparent bg-gradient-to-r from-deeprose to-wine font-medium text-white shadow-md"
                      : "border-charcoal/15 bg-white/60 hover:border-dusty"
                  }`}
                >
                  <input
                    type="radio"
                    name="attending"
                    value={choice}
                    checked={attending === choice}
                    onChange={() => setAttending(choice)}
                    className="sr-only"
                  />
                  {choice === "yes" ? "Joyfully accepts" : "Regretfully declines"}
                </label>
              ))}
            </div>
          </fieldset>

          {attending === "yes" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.2em] text-charcoal/60">
                Total seats needed
              </span>
              <select
                name="guests"
                defaultValue="1"
                className="rounded-xl border border-charcoal/15 bg-white/60 px-4 py-2.5 text-sm outline-none transition focus:border-dusty focus:bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-charcoal/60">
              A short message or wish (optional)
            </span>
            <textarea
              name="message"
              rows={3}
              maxLength={280}
              placeholder="Write your wishes for the couple…"
              className="resize-none rounded-xl border border-charcoal/15 bg-white/60 px-4 py-2.5 text-sm outline-none transition focus:border-dusty focus:bg-white"
            />
          </label>

          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          {error && (
            <p role="alert" className="text-center text-sm text-deeprose">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-primary mx-auto mt-1 rounded-full px-10 py-3 text-sm font-medium tracking-wide disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send RSVP"}
          </button>
        </form>
      )}
    </div>
  );
}
