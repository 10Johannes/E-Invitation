import type { ThemeId } from "@/lib/themes";

export type CouplePhoto = {
  id: string;
  showBesideStory: boolean;
};

export type WeddingEvent = {
  name: string;
  detail: string;
  time: string;
  place: string;
};

export type EntourageGroup = {
  role: string;
  names: string[];
};

export type Settings = {
  theme: ThemeId;
  couple: {
    first: string;
    second: string;
    brideFullName: string;
    groomFullName: string;
  };
  dateISO: string;
  timezoneLabel: string;
  church: {
    name: string;
    address: string;
    mapsUrl: string;
  };
  venue: {
    name: string;
    address: string;
    mapsUrl: string;
  };
  events: WeddingEvent[];
  spotifyPlaylistUrl: string;
  audioUrl: string;
  guestPhotosShowNow: boolean;
  hiddenGuestPhotos: string[];
  heroPhotos: CouplePhoto[];
  loveNote: string;
  dressCode: string;
  registryNote: string;
  registryUrl: string;
  entourage: EntourageGroup[];
};
