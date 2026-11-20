import { NextResponse } from "next/server";

/** Stripe non è nel perimetro Fase 1 né Fase 2 del preventivo. */
export async function POST() {
  return NextResponse.json(
    { error: "Pagamenti Stripe non attivi" },
    { status: 410 },
  );
}
