import { requireAdmin } from "@/lib/auth";
import { getRsvps } from "@/lib/rsvps";

export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const rsvps = await getRsvps();
  const header = [
    "name",
    "attending",
    "guests",
    "message",
    "visible",
    "submitted",
  ];
  const rows = rsvps.map((entry) => [
    entry.name,
    entry.attending === "yes" ? "yes" : "no",
    String(entry.guests),
    entry.message,
    entry.hidden ? "hidden" : "visible",
    new Date(entry.createdAt).toISOString(),
  ]);

  // UTF-8 BOM so Excel opens the file with correct encoding.
  const csv =
    "\uFEFF" +
    [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding-rsvps.csv"',
      "Cache-Control": "no-store",
    },
  });
}
