import { NextResponse } from "next/server";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary, cloudinaryConfigured } from "@/lib/cloudinary";
import { toAlbumId } from "@/lib/albums";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { revalidateGuestPhotos } from "@/lib/photos";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!cloudinaryConfigured) {
    return NextResponse.json(
      { error: "Photo sharing is not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  if (!rateLimit(`upload:${getClientIp(request)}`, 40, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many uploads from this device. Please try again in a while." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const guestName = String(form.get("guestName") ?? "").trim().slice(0, 60);
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP images are allowed." },
      { status: 415 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "That image is too large (max 10 MB)." },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const album = toAlbumId(form.get("album"));
  const context = [
    guestName ? `guest=${guestName}` : null,
    `album=${album}`,
  ]
    .filter(Boolean)
    .join("|");

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "wedding/gallery",
          tags: ["wedding-gallery"],
          context,
          resource_type: "image",
        },
        (error, response) => {
          if (error || !response) reject(error ?? new Error("Cloudinary returned no response"));
          else resolve(response);
        }
      );
      stream.end(buffer);
    });

    revalidateGuestPhotos();

    return NextResponse.json({
      ok: true,
      id: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Upload to Cloudinary failed", error);
    return NextResponse.json(
      { error: "Could not save your photo. Please try again." },
      { status: 502 }
    );
  }
}
