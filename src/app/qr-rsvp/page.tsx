import type { Metadata } from "next";
import PrintButton from "@/components/PrintButton";
import QrRsvpPostcard from "./QrRsvpPostcard";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RSVP Postcard · Respond to Our Invitation",
  description:
    "Printable A6 postcard — guests scan the code to open their invitation and RSVP.",
};

export default async function QrRsvpCardPage() {
  const settings = await getSettings();

  return (
    <main className="flex min-h-svh flex-col items-center gap-8 px-4 py-12">
      <div className="text-center no-print">
        <h1 className="font-serif text-3xl italic text-gradient">
          RSVP Table Postcard
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-charcoal/70">
          Prints at exactly A6 landscape (148 × 105 mm). In your browser&apos;s
          print dialog, choose <strong>A6 / 148×105 mm</strong> paper and enable{" "}
          <strong>background graphics</strong> so the colors come out.
        </p>
      </div>

      <QrRsvpPostcard
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