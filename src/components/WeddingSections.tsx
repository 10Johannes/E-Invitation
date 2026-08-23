import type { EntourageGroup } from "@/lib/settings";
import { BrushHeart } from "@/components/Ornaments";
import Reveal from "@/components/Reveal";

export function Entourage({ groups }: { groups: EntourageGroup[] }) {
  const filled = groups.filter((group) => group.names.length > 0);
  if (filled.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-2xl gap-5 sm:grid-cols-2 sm:gap-6">
      {filled.map((group, index) => (
        <Reveal key={group.role} delay={0.05 * (index % 4)}>
          <div className="glass h-full rounded-3xl p-7">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-wine/70">
              {group.role}
            </p>
            <hr className="hr-gradient mx-auto my-4 w-12 rounded-full" />
            <ul className="flex flex-col items-center gap-1.5 font-serif text-lg italic leading-snug text-charcoal/85">
              {group.names.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function RegistryCards({
  dressCode,
  registryNote,
  registryUrl,
}: {
  dressCode: string;
  registryNote: string;
  registryUrl: string;
}) {
  if (!dressCode && !registryNote && !registryUrl) return null;

  const validRegistryUrl =
    registryUrl && /^https?:\/\//.test(registryUrl) ? registryUrl : "";

  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
      {dressCode && (
        <Reveal>
          <div className="glass h-full rounded-3xl p-7 text-center">
            <BrushHeart className="mx-auto h-4 w-auto text-deeprose/70" />
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-charcoal/60">
              Dress Code
            </p>
            <p className="mt-2 font-serif text-xl italic text-wine">
              {dressCode}
            </p>
          </div>
        </Reveal>
      )}
      {(registryNote || validRegistryUrl) && (
        <Reveal delay={0.1}>
          <div className="glass flex h-full flex-col items-center rounded-3xl p-7 text-center">
            <BrushHeart className="h-4 w-auto text-deeprose/70" />
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-charcoal/60">
              Gifts
            </p>
            {registryNote && (
              <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                {registryNote}
              </p>
            )}
            {validRegistryUrl && (
              <a
                href={validRegistryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-medium"
              >
                View Registry
              </a>
            )}
          </div>
        </Reveal>
      )}
    </div>
  );
}
