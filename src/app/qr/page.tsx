import type { Metadata } from "next";
import PrintButton from "@/components/PrintButton";
import QrPostcard from "./QrPostcard";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QR Postcard · Share Your Photos",
  description:
    "Printable postcard for the reception tables — guests scan to share their photos.",
};

export default async function QrCardPage() {
  const settings = await getSettings();

  return (
    <main className="postcard-page flex min-h-svh flex-col items-center gap-8 px-4 py-12">
      <div className="text-center no-print">
        <h1 className="font-serif text-3xl italic text-gradient">
          QR Table Postcard
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-charcoal/70">
          The card prints edge-to-edge and auto-fills whichever paper size you
          select. In your browser&apos;s print dialog, enable{" "}
          <strong>background graphics</strong> so the colors come out, and
          uncheck <strong>headers &amp; footers</strong> for a full-bleed card.
        </p>
      </div>

      <QrPostcard
        brideFullName={settings.couple.brideFullName}
        groomFullName={settings.couple.groomFullName}
        first={settings.couple.first}
        second={settings.couple.second}
        dateISO={settings.dateISO}
      />

      <PrintButton />
    </main>
  );
}
