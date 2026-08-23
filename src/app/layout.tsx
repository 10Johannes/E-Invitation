import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Jost } from "next/font/google";
import "./globals.css";
import { formatDateLabel } from "@/config/wedding";
import { getSettings } from "@/lib/store";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const script = Great_Vibes({
  variable: "--font-greatvibes",
  subsets: ["latin"],
  weight: "400",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const { couple, venue, dateISO } = settings;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: `${couple.first} & ${couple.second} · Wedding Invitation`,
    description: `Join us in celebrating the wedding of ${couple.first} and ${couple.second} — ${formatDateLabel(dateISO)}, ${venue.name}.`,
    openGraph: {
      title: `${couple.first} & ${couple.second} · Wedding Invitation`,
      description: `${formatDateLabel(dateISO)} · ${venue.name}`,
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ebdbdd",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html
      lang="en"
      data-theme={settings.theme}
      className={`${cormorant.variable} ${script.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
