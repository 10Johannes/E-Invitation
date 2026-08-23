import { NextResponse } from "next/server";
import type { UploadApiResponse } from "cloudinary";
import { isAdmin } from "@/lib/auth";
import { cloudinary, cloudinaryConfigured } from "@/lib/cloudinary";
import { MAX_COUPLE_PHOTOS } from "@/lib/limits";
import { getSettings } from "@/lib/store";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!cloudinaryConfigured) {
    return NextResponse.json(
      { error: "Photo storage is not configured (missing Cloudinary keys)." },
      { status: 503 }
    );
  }

  const currentCount = (await getSettings()).heroPhotos.length;
  if (currentCount >= MAX_COUPLE_PHOTOS) {
    return NextResponse.json(
      { error: `You can keep up to ${MAX_COUPLE_PHOTOS} couple photos. Remove one first.` },
      { status: 409 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

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
      { error: `"${file.name}" is too large (max 10 MB).` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "wedding/couple",
          tags: ["couple-hero"],
          resource_type: "image",
        },
        (error, response) => {
          if (error || !response)
            reject(error ?? new Error("Cloudinary returned no response"));
          else resolve(response);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      ok: true,
      id: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Couple photo upload failed", error);
    return NextResponse.json(
      { error: "Could not save that photo. Please try again." },
      { status: 502 }
    );
  }
}
