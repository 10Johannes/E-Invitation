"use client";

import { useEffect, useState } from "react";

/**
 * QR code pointing at this site's /upload page.
 * Generated client-side from the actual origin, so it is always
 * correct on localhost, *.vercel.app, or a custom domain.
 */
export default function QrCodeDisplay({ size = 180 }: { size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      const styles = getComputedStyle(document.documentElement);
      const dark =
        styles.getPropertyValue("--t-heading").trim() || "#6e434dff";
      const light = styles.getPropertyValue("--t-panel").trim() || "#f8f2f0ff";
      const url = await QRCode.toDataURL(`${window.location.origin}/upload`, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: size * 2,
        color: { dark, light },
      });
      if (!cancelled) setDataUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [size]);

  if (!dataUrl) {
    return (
      <div
        aria-hidden
        style={{ width: size, height: size }}
        className="animate-pulse rounded-xl bg-white/40"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code — scan to share your photos with the couple"
      width={size}
      height={size}
      className="rounded-xl"
    />
  );
}
