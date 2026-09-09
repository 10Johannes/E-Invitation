import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import QrRsvpPostcard from "./QrRsvpPostcard";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RSVP Postcard · Respond to Our Invitation",
  description:
    "Printable postcard — guests scan the code to respond to their RSVP.",
};

export default async function QrRsvpCardPage() {
  const settings = await getSettings();

  return (
    <main className="postcard-page flex min-h-svh flex-col items-center gap-8 px-4 py-12">
      <div className="text-center no-print">
        <h1 className="font-serif text-3xl italic text-gradient">
          RSVP Table Postcard
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-charcoal/70">
          The card prints edge-to-edge and auto-fills whichever paper size you
          select. In your browser&apos;s print dialog, enable{" "}
          <strong>background graphics</strong> so the colors come out, and
          uncheck <strong>headers &amp; footers</strong> for a full-bleed card.
        </p>
      </div>

      <QrRsvpPostcard
        brideFullName={settings.couple.brideFullName}
        groomFullName={settings.couple.groomFullName}
        first={settings.couple.first}
        second={settings.couple.second}
        dateISO={settings.dateISO}
      />

      <div className="no-print flex flex-wrap items-center justify-center gap-3">
        <PrintButton />
        <Link
          href="/rsvp"
          className="rounded-full border border-wine/30 px-8 py-3 text-sm font-medium tracking-wide text-wine transition hover:bg-wine/5"
        >
          Go to RSVP form
        </Link>
      </div>
    </main>
  );
}