"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `Login failed (${response.status})`);
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="glass w-full max-w-sm rounded-3xl p-8 text-center"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-wine/70">
          Wedding Admin
        </p>
        <h1 className="mt-2 font-serif text-3xl italic text-gradient">
          Sign in
        </h1>
        <hr className="hr-gradient mx-auto my-5 w-12 rounded-full" />

        <label className="block text-left text-sm font-medium text-charcoal">
          Passcode
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-charcoal/10 bg-charcoal/5 px-4 py-3 text-base text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-deeprose focus:bg-charcoal/10"
            placeholder="Enter the admin passcode"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-deeprose">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !passcode}
          className="btn-primary mt-6 w-full rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-60"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
