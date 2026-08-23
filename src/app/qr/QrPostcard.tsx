"use client";

import { useEffect, useState } from "react";
import { LeafBranch } from "@/components/Ornaments";
import { formatShortDate } from "@/config/wedding";

type QrPostcardProps = {
  brideFullName: string;
  groomFullName: string;
  first: string;
  second: string;
  dateISO: string;
};

export default function QrPostcard({
  brideFullName,
  groomFullName,
  first,
  second,
  dateISO,
}: QrPostcardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "";
      setUploadUrl(origin + "/upload");
      const QRCode = (await import("qrcode")).default;
      const styles = getComputedStyle(document.documentElement);
      const dark = styles.getPropertyValue("--t-heading").trim() || "#6e434d";
      const light = styles.getPropertyValue("--t-panel").trim() || "#f8f2f0";
      const url = await QRCode.toDataURL(`${origin}/upload`, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 560,
        color: { dark, light },
      });
      if (!cancelled) setQrDataUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="postcard postcard-screen relative overflow-hidden rounded-lg bg-[var(--t-panel)] text-[var(--t-text)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60mm 60mm at 8% 10%, var(--grad-glow), transparent 65%), radial-gradient(55mm 55mm at 95% 92%, var(--grad-glow), transparent 62%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[4mm] rounded-md border border-dusty/50"
      />

      <LeafBranch className="absolute -left-1 -top-1 h-14 w-auto rotate-12 text-wine/20" flip />
      <LeafBranch className="absolute -bottom-1 -right-1 h-14 w-auto -rotate-180 text-wine/20" />

      <div className="relative flex h-full w-full items-center gap-7 px-[11mm]">
        <div className="flex-1">
          <p className="text-[7pt] uppercase tracking-[0.3em] text-wine/75">
            The wedding of
          </p>
          <p className="mt-1.5 font-serif text-[15pt] italic leading-tight">
            <span style={{ backgroundImage: "var(--grad-heading)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {brideFullName || first}
            </span>
          </p>
          <p className="font-serif text-[15pt] italic leading-tight">
            <span style={{ backgroundImage: "var(--grad-heading)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              &amp; {groomFullName || second}
            </span>
          </p>
          <hr className="hr-gradient my-3 w-16 rounded-full" />
          <p className="font-serif text-[10pt] italic text-wine/90">
            {formatShortDate(dateISO)}
          </p>
          <p className="mt-3.5 text-[9.5pt] font-medium text-charcoal">
            Snap, scan &amp; share your photos with us!
          </p>
          <p className="mt-1 max-w-[52mm] text-[7.5pt] leading-snug text-charcoal/70">
            Point your camera at the code to add your pictures to our guest
            gallery.
          </p>
          <p className="mt-1.5 break-all text-[7pt] tracking-wide text-charcoal/60">
            {uploadUrl ? uploadUrl.replace(/^https?:\/\//, "") : "\u00A0"}
          </p>
        </div>

        <div className="-rotate-1 rounded-lg bg-white p-[3mm] shadow-md">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code linking to the photo upload page" className="block h-[36mm] w-[36mm]" />
          ) : (
            <div className="h-[36mm] w-[36mm] animate-pulse rounded bg-black/5" />
          )}
          <p className="mt-1 text-center font-serif text-[8pt] italic text-wine/80">
            scan me
          </p>
        </div>
      </div>
    </div>
  );
}
