import { NextResponse } from "next/server";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { getPhotos } from "@/lib/photos";

export const revalidate = 60;

export async function GET() {
  const photos = await getPhotos();
  return NextResponse.json(
    { configured: cloudinaryConfigured, count: photos.length, photos },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
