import type { Metadata } from "next";
import UploadClient from "./upload-client";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `Share Your Photos · ${settings.couple.first} & ${settings.couple.second}`,
    description: `Add the photos you took at the wedding of ${settings.couple.first} and ${settings.couple.second} to their guest gallery.`,
  };
}

export default async function UploadPage() {
  const settings = await getSettings();
  return (
    <UploadClient
      first={settings.couple.first}
      second={settings.couple.second}
    />
  );
}
