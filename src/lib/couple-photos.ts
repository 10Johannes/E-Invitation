import { cloudinary, cloudinaryConfigured } from "./cloudinary";
import type { CouplePhoto } from "./settings";

export type PhotoView = CouplePhoto & {
  thumbUrl: string;
  fullUrl: string;
};

export function buildPhotoViews(photos: CouplePhoto[]): PhotoView[] {
  if (!cloudinaryConfigured) return [];
  return photos.map((photo) => ({
    ...photo,
    thumbUrl: cloudinary.url(photo.id, {
      secure: true,
      transformation: [
        { width: 640, crop: "limit", fetch_format: "auto", quality: "auto" },
      ],
    }),
    fullUrl: cloudinary.url(photo.id, {
      secure: true,
      transformation: [
        { width: 1600, crop: "limit", fetch_format: "auto", quality: "auto" },
      ],
    }),
  }));
}
