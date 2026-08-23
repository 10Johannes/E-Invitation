import { unstable_cache } from "next/cache";
import { cloudinary, cloudinaryConfigured } from "./cloudinary";

export type GalleryPhoto = {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  guest?: string;
  createdAt?: string;
};

async function fetchPhotos(): Promise<GalleryPhoto[]> {
  if (!cloudinaryConfigured) return [];

  try {
    const result = await cloudinary.api.resources_by_tag("wedding-gallery", {
      resource_type: "image",
      max_results: 100,
      context: true,
      sort_by: [["created_at", "desc"]],
    });

    return result.resources.map((resource) => {
      const context = resource.context as
        | { custom?: { guest?: unknown } }
        | undefined;
      const guest =
        typeof context?.custom?.guest === "string"
          ? context.custom.guest
          : undefined;

      return {
        id: resource.public_id,
        thumbUrl: cloudinary.url(resource.public_id, {
          secure: true,
          transformation: [
            { width: 640, crop: "limit", fetch_format: "auto", quality: "auto" },
          ],
        }),
        fullUrl: cloudinary.url(resource.public_id, {
          secure: true,
          transformation: [
            { width: 1600, crop: "limit", fetch_format: "auto", quality: "auto" },
          ],
        }),
        width: resource.width,
        height: resource.height,
        guest,
        createdAt:
          typeof resource.created_at === "string"
            ? resource.created_at
            : undefined,
      };
    });
  } catch (error) {
    console.error("Failed to list gallery photos", error);
    return [];
  }
}

/**
 * Cached for 60s to stay well within Cloudinary Admin API rate limits.
 */
export const getPhotos = unstable_cache(fetchPhotos, ["wedding-gallery"], {
  revalidate: 60,
  tags: ["wedding-gallery"],
});

/** Fresh read for the admin panel — bypasses the 60s cache. */
export async function getPhotosUncached(): Promise<GalleryPhoto[]> {
  return fetchPhotos();
}
