import { ImageResponse } from "next/og";
import { formatDateLabel } from "@/config/wedding";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const settings = await getSettings();
  const { couple } = settings;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ebdbdd",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(201, 154, 164, 0.5), transparent 55%), radial-gradient(circle at 85% 80%, rgba(168, 107, 120, 0.4), transparent 55%)",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 14,
            color: "#6e434d",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          The Wedding Of
        </div>
        <div
          style={{
            fontSize: 96,
            color: "#6e434d",
            marginTop: 16,
            display: "flex",
          }}
        >
          {`${couple.first} & ${couple.second}`}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#4a3b40",
            marginTop: 20,
            display: "flex",
          }}
        >
          {formatDateLabel(settings.dateISO)}
        </div>
      </div>
    ),
    size
  );
}
