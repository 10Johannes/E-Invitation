import { BrushHeart } from "@/components/Ornaments";

export type Wish = {
  name: string;
  message: string;
};

export default function WishesWall({ wishes }: { wishes: Wish[] }) {
  if (wishes.length === 0) return null;

  const doubled = [...wishes, ...wishes];

  return (
    <div className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--t-bg)] to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--t-bg)] to-transparent sm:w-16" />
      <div className="animate-marquee flex w-max gap-4 pr-4 group-hover:[animation-play-state:paused]">
        {doubled.map((wish, index) => (
          <figure
            key={`${wish.name}-${index}`}
            className="glass flex w-64 shrink-0 flex-col gap-2 rounded-2xl p-5"
          >
            <BrushHeart className="h-3.5 w-auto text-deeprose/60" />
            <blockquote className="font-serif text-sm italic leading-relaxed text-charcoal/85">
              “{wish.message}”
            </blockquote>
            <figcaption className="mt-auto pt-1 font-script text-xl leading-none text-wine/80">
              — {wish.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
