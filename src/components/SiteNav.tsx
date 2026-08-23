"use client";

import { useEffect, useState } from "react";

type NavItem = { href: string; label: string };

type SiteNavProps = {
  initials: string;
  items: NavItem[];
};

export default function SiteNav({ initials, items }: SiteNavProps) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const sections = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Sections"
      className="no-print fixed inset-x-0 top-3 z-40 flex justify-center px-3"
      style={{ animation: "nav-in .7s ease .9s backwards" }}
    >
      <div className="glass flex max-w-full items-center gap-0.5 rounded-full p-1.5 pl-2 shadow-lg shadow-wine/10">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-script text-sm leading-none text-white shadow-inner"
          style={{ backgroundImage: "var(--grad-accent)" }}
        >
          {initials}
        </span>
        <span aria-hidden className="mx-1.5 h-5 w-px shrink-0 bg-charcoal/10" />
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "true" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
                active === item.href
                  ? "bg-wine text-ivory"
                  : "text-charcoal/70 hover:bg-wine/10 hover:text-wine"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
