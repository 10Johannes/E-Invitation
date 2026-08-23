import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";
import type { ContentInput } from "./actions";
import { buildPhotoViews } from "@/lib/couple-photos";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { getRsvps } from "@/lib/rsvps";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wedding Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const [settings, rsvps] = await Promise.all([getSettings(), getRsvps()]);

  const content: ContentInput = {
    couple: settings.couple,
    dateISO: settings.dateISO,
    timezoneLabel: settings.timezoneLabel,
    church: settings.church,
    venue: settings.venue,
    events: settings.events,
    spotifyPlaylistUrl: settings.spotifyPlaylistUrl,
    uploadPasscodeHint: settings.uploadPasscodeHint,
    loveNote: settings.loveNote,
    dressCode: settings.dressCode,
    registryNote: settings.registryNote,
    registryUrl: settings.registryUrl,
    entourage: settings.entourage.map((g) => ({
      role: g.role,
      namesText: g.names.join("\n"),
    })),
  };

  return (
    <AdminDashboard
      theme={settings.theme}
      content={content}
      photoViews={buildPhotoViews(settings.heroPhotos)}
      cloudinaryReady={cloudinaryConfigured}
      coupleFirst={settings.couple.first}
      coupleSecond={settings.couple.second}
      guestPhotosShowNow={settings.guestPhotosShowNow}
      rsvps={rsvps}
    />
  );
}
