import type { Metadata } from "next";
import Link from "next/link";
import RsvpSection from "@/components/RsvpSection";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `RSVP · ${settings.couple.first} & ${settings.couple.second}`,
    description: `Confirm your attendance at the wedding of ${settings.couple.first} and ${settings.couple.second}.`,
  };
}

export default async function RsvpPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center gap-8 px-4 py-12">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-wine/80">
          {settings.couple.first} &amp; {settings.couple.second}
        </p>
        <h1 className="mt-2 font-serif text-4xl italic text-gradient">
          Will You Join Us?
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.25em] text-charcoal/60">
          Kindly confirm your attendance
        </p>
      </header>

      <RsvpSection
        first={settings.couple.first}
        second={settings.couple.second}
      />

      <Link
        href="/"
        className="text-xs tracking-wide text-charcoal/60 underline decoration-dusty underline-offset-4 transition hover:text-wine"
      >
        Back to the invitation
      </Link>
    </main>
  );
}