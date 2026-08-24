import Countdown from "@/components/Countdown";
import FloralDivider from "@/components/FloralDivider";
import Gallery from "@/components/Gallery";
import InvitationGate from "@/components/InvitationGate";
import SiteNav from "@/components/SiteNav";
import MomentStrip from "@/components/MomentStrip";
import PetalFall from "@/components/PetalFall";
import RsvpSection from "@/components/RsvpSection";
import TapHearts from "@/components/TapHearts";
import { BrushHeart, GlowDot } from "@/components/Ornaments";
import Parallax from "@/components/Parallax";
import QrCodeDisplay from "@/components/QrCodeDisplay";
import Reveal from "@/components/Reveal";
import SidePhoto from "@/components/SidePhoto";
import VinylPlayer from "@/components/VinylPlayer";
import WishesWall from "@/components/WishesWall";
import { Entourage, RegistryCards } from "@/components/WeddingSections";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import HeroSlideshow from "@/components/HeroSlideshow";
import { ScrollDepthProvider } from "@/components/ScrollDepthProvider";
import Vines from "@/components/Vines";
import { formatDateLabel, weddingYear } from "@/config/wedding";
import { buildCalendarLinks, isEventStarted } from "@/lib/calendar";
import { buildPhotoViews } from "@/lib/couple-photos";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { getPhotos } from "@/lib/photos";
import { getRsvps } from "@/lib/rsvps";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ to?: string }>;
};

function icsFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `wedding-${slug || "event"}.ics`;
}

function CalendarButtons({
  title,
  detail,
  time,
  place,
  dateISO,
  addressFallback,
}: {
  title: string;
  detail?: string;
  time: string;
  place: string;
  dateISO: string;
  addressFallback?: string;
}) {
  const links = buildCalendarLinks({
    title,
    detail,
    time,
    place,
    dateISO,
    addressFallback,
    durationHours: 3,
  });
  if (!links) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.18em]">
      <a
        href={links.googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-dusty/50 px-3 py-1 text-wine/80 transition hover:bg-charcoal/5"
      >
        Google Cal
      </a>
      <a
        href={links.icsUrl}
        download={icsFileName(title)}
        className="rounded-full border border-dusty/50 px-3 py-1 text-wine/80 transition hover:bg-charcoal/5"
      >
        ICS
      </a>
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const [{ to }, settings] = await Promise.all([searchParams, getSettings()]);
  const guestName = to?.trim().slice(0, 60) || undefined;

  const [guestPhotos, photoViews, rsvps] = await Promise.all([
    getPhotos(),
    Promise.resolve(buildPhotoViews(settings.heroPhotos)),
    getRsvps(),
  ]);

  const heroSlides = photoViews.map((p) => ({ id: p.id, url: p.fullUrl }));
  const besidePhotos = photoViews.filter((p) => p.showBesideStory);
  const sideAt = (index: number) =>
    besidePhotos.length > 0
      ? besidePhotos[index % besidePhotos.length].thumbUrl
      : null;

  const wishes = rsvps
    .filter((entry) => !entry.hidden && entry.message)
    .slice(0, 12)
    .map((entry) => ({ name: entry.name, message: entry.message }));

  const { couple, venue, events } = settings;
  const showEntourage = settings.entourage.some((g) => g.names.length > 0);
  const eventStarted = isEventStarted(settings.dateISO);
  const hiddenPhotoIds = new Set(settings.hiddenGuestPhotos);
  const visibleGuestPhotos = guestPhotos.filter(
    (photo) => !hiddenPhotoIds.has(photo.id)
  );
  const galleryOpen =
    eventStarted ||
    (settings.guestPhotosShowNow && visibleGuestPhotos.length > 0);

  return (
    <ScrollDepthProvider>
      <BackgroundOrbs />
      <Vines />
      <PetalFall />
      <TapHearts />
      <SiteNav
        initials={`${couple.first[0] ?? ""}&${couple.second[0] ?? ""}`}
        items={[
          { href: "#details", label: "Details" },
          { href: "#playlist", label: "Music" },
          ...(galleryOpen ? [{ href: "#gallery", label: "Gallery" }] : []),
          { href: "#rsvp", label: "RSVP" },
        ]}
      />
      <InvitationGate
        first={couple.first}
        second={couple.second}
        guestName={guestName}
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24">
        {/* Hero */}
        <section className="relative text-center">
          <div className="relative h-[58svh] min-h-[340px] overflow-hidden sm:h-[66svh]">
            <HeroSlideshow photos={heroSlides} />
          </div>

          <div className="relative mx-auto mt-9 flex max-w-xl flex-col items-center gap-5 px-2">
            <Parallax
              speed={-0.12}
              aria-hidden
              className="pointer-events-none absolute -left-4 top-3 hidden text-wine/25 sm:block"
            >
              <BrushHeart className="h-24 w-auto -rotate-12" flip />
            </Parallax>
            <Parallax
              speed={0.22}
              rotate={8}
              aria-hidden
              className="pointer-events-none absolute -right-4 bottom-8 hidden text-wine/25 sm:block"
            >
              <BrushHeart className="h-24 w-auto rotate-12" />
            </Parallax>

            <Reveal>
              <p className="glass rounded-full px-5 py-2 text-xs uppercase tracking-[0.35em] text-wine/90">
                The Wedding Of
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-script text-6xl leading-tight drop-shadow-sm sm:text-7xl">
                <span className="text-gradient">
                  {couple.first}{" "}
                  <span className="font-sans text-4xl text-dusty sm:text-5xl">
                    &amp;
                  </span>{" "}
                  {couple.second}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="font-serif text-xl text-charcoal">
                {formatDateLabel(settings.dateISO)} · {settings.timezoneLabel}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <Countdown dateISO={settings.dateISO} />
            </Reveal>
            <Reveal delay={0.4}>
              <a
                href="#details"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs font-medium uppercase tracking-[0.25em]"
              >
                View details ↓
              </a>
            </Reveal>
          </div>
        </section>

        <MomentStrip photos={besidePhotos.map((p) => p.thumbUrl)} />

        {/* Intro */}
        <section className="py-14 text-center">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-wine/70">
              Together with their families
            </p>
            <p className="mx-auto mt-5 max-w-md font-serif text-2xl italic leading-snug text-gradient">
              {couple.brideFullName || couple.first}
              <span className="text-dusty"> &amp; </span>
              {couple.groomFullName || couple.second}
            </p>
            <hr className="hr-gradient mx-auto my-6 w-24 rounded-full" />
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-charcoal/75">
              joyfully invite you to celebrate the beginning of their forever
            </p>
            {settings.loveNote && (
              <p className="mx-auto mt-8 max-w-md font-script text-2xl leading-relaxed text-wine/85">
                “{settings.loveNote}”
              </p>
            )}
          </Reveal>
          <FloralDivider className="mt-12" />
        </section>

        {/* Details */}
        <div className="relative">
          {sideAt(0) && (
            <SidePhoto src={sideAt(0)!} side="left" tilt={-6} />
          )}
          <section id="details" className="scroll-mt-8 py-14">
            <Reveal>
              <h2 className="mb-2 text-center font-serif text-4xl italic text-gradient">
                The Celebration
              </h2>
              <p className="mb-10 text-center text-sm uppercase tracking-[0.25em] text-charcoal/60">
                {venue.name}
              </p>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
              {events.map((event, i) => (
                <Reveal key={event.name} delay={0.1 * i}>
                  <div className="glass h-full rounded-3xl p-7 text-center">
                    <h3 className="font-serif text-2xl italic text-wine">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-charcoal/60">
                      {event.detail}
                    </p>
                    <hr className="hr-gradient mx-auto my-4 w-12 rounded-full" />
                    <p className="text-lg font-medium text-charcoal">{event.time}</p>
                    <p className="mt-1 text-sm text-charcoal/80">{event.place}</p>
                    <CalendarButtons
                      title={`${couple.first} & ${couple.second} · ${event.name}`}
                      detail={event.detail}
                      time={event.time}
                      place={event.place}
                      dateISO={settings.dateISO}
                      addressFallback={venue.address}
                    />
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2} className="mt-6 sm:mt-8">
              <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
                <div className="glass rounded-3xl p-7 text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-charcoal/60">
                    Ceremony
                  </p>
                  <p className="mt-2 font-serif text-xl italic text-wine">
                    {settings.church.name}
                  </p>
                  <p className="mt-1 text-sm text-charcoal/80">
                    {settings.church.address}
                  </p>
                  <a
                    href={settings.church.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-medium"
                  >
                    Open in Maps
                  </a>
                  <CalendarButtons
                    title={`Wedding Ceremony · ${couple.first} & ${couple.second}`}
                    time={events[0]?.time ?? ""}
                    place={settings.church.name}
                    dateISO={settings.dateISO}
                  />
                </div>
                <div className="glass rounded-3xl p-7 text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-charcoal/60">
                    Reception
                  </p>
                  <p className="mt-2 font-serif text-xl italic text-wine">
                    {venue.name}
                  </p>
                  <p className="mt-1 text-sm text-charcoal/80">{venue.address}</p>
                  <a
                    href={venue.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-medium"
                  >
                    Open in Maps
                  </a>
                  <CalendarButtons
                    title={`Wedding Reception · ${couple.first} & ${couple.second}`}
                    time={events.find((e) => /reception/i.test(e.name))?.time ?? events[1]?.time ?? ""}
                    place={venue.name}
                    dateISO={settings.dateISO}
                  />
                </div>
              </div>
            </Reveal>

            {(settings.dressCode || settings.registryNote || settings.registryUrl) && (
              <Reveal delay={0.15} className="mt-6 sm:mt-8">
                <RegistryCards
                  dressCode={settings.dressCode}
                  registryNote={settings.registryNote}
                  registryUrl={settings.registryUrl}
                />
              </Reveal>
            )}
          </section>
        </div>

        {/* Entourage */}
        {showEntourage && (
          <div className="relative">
            <section id="entourage" className="scroll-mt-8 py-14">
              <Reveal>
                <h2 className="mb-2 text-center font-serif text-4xl italic text-gradient">
                  Our Entourage
                </h2>
                <p className="mb-10 text-center text-sm uppercase tracking-[0.25em] text-charcoal/60">
                  The people closest to our hearts
                </p>
              </Reveal>
              <Entourage groups={settings.entourage} />
              <FloralDivider className="mt-14" />
            </section>
          </div>
        )}

        {/* Playlist */}
        <div className="relative">
          {sideAt(1) && (
            <SidePhoto src={sideAt(1)!} side="right" tilt={5} />
          )}
          <section id="playlist" className="scroll-mt-8 py-14">
            <Reveal>
              <h2 className="mb-2 text-center font-serif text-4xl italic text-gradient">
                Our Soundtrack
              </h2>
              <p className="mb-10 text-center text-sm uppercase tracking-[0.25em] text-charcoal/60">
                Press play while you browse
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <VinylPlayer
                playlistUrl={settings.spotifyPlaylistUrl}
                first={couple.first}
                second={couple.second}
              />
            </Reveal>
          </section>
        </div>

        {/* Guest gallery — shown during and after the event, or as soon as
            the first guest photo arrives (configurable in /admin) */}
        {galleryOpen && (
          <>
            <div className="relative">
              {sideAt(3) && (
                <SidePhoto src={sideAt(3)!} side="left" tilt={-4} />
              )}
              <Parallax speed={0.35} aria-hidden className="pointer-events-none absolute -right-10 top-0 hidden lg:block">
                <GlowDot className="h-36 w-36" />
              </Parallax>
              <section id="gallery" className="scroll-mt-8 py-14">
                <Reveal>
                  <h2 className="mb-2 text-center font-serif text-4xl italic text-gradient">
                    Moments From Our Guests
                  </h2>
                  <p className="mb-10 text-center text-sm uppercase tracking-[0.25em] text-charcoal/60">
                    Live gallery · updated as photos arrive
                  </p>
                </Reveal>

                {visibleGuestPhotos.length > 0 ? (
                  <Gallery photos={visibleGuestPhotos} />
                ) : (
                  <Reveal delay={0.1}>
                    <div className="glass rounded-3xl p-10 text-center">
                      <p className="font-serif text-xl italic text-wine">
                        No photos yet — be the first to share one!
                      </p>
                      {!cloudinaryConfigured && (
                        <p className="mt-2 text-xs text-charcoal/50">
                          (Photo storage is not configured yet — see README.)
                        </p>
                      )}
                    </div>
                  </Reveal>
                )}
              </section>
            </div>
          </>
        )}

        {/* RSVP + Wishes */}
        <div className="relative">
          {sideAt(2) && (
            <SidePhoto src={sideAt(2)!} side="left" tilt={4} />
          )}
          <section id="rsvp" className="scroll-mt-8 py-14">
            <Reveal>
              <h2 className="mb-2 text-center font-serif text-4xl italic text-gradient">
                Will You Join Us?
              </h2>
              <p className="mb-10 text-center text-sm uppercase tracking-[0.25em] text-charcoal/60">
                Kindly respond at your earliest convenience
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <RsvpSection first={couple.first} second={couple.second} />
            </Reveal>

            {wishes.length > 0 && (
              <div className="mt-14">
                <p className="mb-5 text-center text-xs uppercase tracking-[0.25em] text-charcoal/60">
                  Wishes from our guests
                </p>
                <WishesWall wishes={wishes} />
              </div>
            )}
          </section>
        </div>

        {/* Share CTA — always available once photo storage is configured;
            gallery visibility above does not gate sharing */}
        {cloudinaryConfigured && (
          <div className="relative">
            <Parallax speed={-0.18} aria-hidden className="pointer-events-none absolute -left-12 bottom-0 hidden lg:block">
              <GlowDot className="h-44 w-44" />
            </Parallax>
            <section id="share" className="scroll-mt-8 py-14">
              <Reveal>
                <div className="glass flex flex-col items-center gap-5 rounded-3xl p-10 text-center">
                  <h2 className="font-serif text-4xl italic text-gradient">
                    Took some photos?
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-charcoal/80">
                    Scan the code with your phone camera, or tap the button below,
                    to add your pictures to our gallery.
                  </p>
                  <QrCodeDisplay size={150} />
                  <a
                    href="/upload"
                    className="btn-primary rounded-full px-8 py-3 text-sm font-medium tracking-wide"
                  >
                    Share Your Photos
                  </a>
                </div>
              </Reveal>
            </section>
          </div>
        )}

        <footer className="pt-6 text-center">
          <p className="font-script text-4xl text-wine/75">
            {couple.first} &amp; {couple.second}
          </p>
          <p className="mt-3 text-xs tracking-wide text-charcoal/50">
            {weddingYear(settings.dateISO)} · Made with love
          </p>
        </footer>
      </main>
    </ScrollDepthProvider>
  );
}
