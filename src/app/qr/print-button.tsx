"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-full bg-wine px-8 py-3 text-sm font-medium tracking-wide text-ivory transition hover:bg-deeprose"
    >
      Print This Card
    </button>
  );
}
