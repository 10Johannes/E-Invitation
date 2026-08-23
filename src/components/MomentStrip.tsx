import Image from "next/image";

export default function MomentStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="mt-12 lg:hidden" data-moment-strip>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3">
        {photos.map((src, i) => (
          <figure
            key={src + i}
            className="w-44 shrink-0 snap-center rounded-xl bg-[var(--t-panel)] p-2.5 pb-7 shadow-lg shadow-wine/10"
            style={{ rotate: i % 2 === 0 ? "-2deg" : "2deg" }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image src={src} alt="" fill sizes="176px" className="object-cover" />
            </div>
          </figure>
        ))}
      </div>
      <p className="mt-1 text-center text-[0.65rem] uppercase tracking-[0.25em] text-charcoal/50">
        swipe for more of us
      </p>
    </div>
  );
}
