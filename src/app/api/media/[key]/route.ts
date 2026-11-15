import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { database, localMode } from "@/lib/platform/store";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!/^[-a-f0-9]{36}\.webp$/.test(key))
    return new NextResponse(null, { status: 404 });
  try {
    const data = localMode()
      ? await readFile(`.data/media/${key}`)
      : (await database().mediaAsset.findUnique({ where: { id: key } }))?.data;
    if (!data) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public,max-age=31536000,immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
