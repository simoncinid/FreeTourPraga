import { NextResponse } from "next/server";
import { reservationIcs } from "@/lib/platform/calendar";
import {
  getReservation,
  requireBookingManagement,
} from "@/lib/platform/booking";
import { readState } from "@/lib/platform/store";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pnr: string }> },
) {
  try {
    const s = await readState();
    const pnr = (await params).pnr;
    const query = new URL(request.url).searchParams;
    const b = query.has("manage")
      ? requireBookingManagement(s, pnr, query.get("manage") || "")
      : getReservation(s, pnr, query.get("token") || "");
    const calendar = reservationIcs(s, b);
    return new NextResponse(calendar, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${b.pnr}.ics"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Link non valido o scaduto" },
      { status: 404 },
    );
  }
}
