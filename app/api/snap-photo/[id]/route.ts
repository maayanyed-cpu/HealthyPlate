import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/* Authenticated proxy for private Vercel Blob photos.
   The blob store is configured for private access, so the URLs
   stored on Meal.beforePhotoUrl / afterPhotoUrl can't be loaded
   directly by the browser. This route fetches the blob server-side
   with the R/W token and streams the bytes back, so an <img src>
   on Confirm or Analysis just works. */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const url = new URL(request.url);
  const phase = url.searchParams.get("phase") === "after" ? "after" : "before";

  const meal = await db.meal.findUnique({
    where: { id: params.id },
    select: { beforePhotoUrl: true, afterPhotoUrl: true },
  });
  if (!meal) {
    return new NextResponse("Meal not found", { status: 404 });
  }

  const blobUrl =
    phase === "after" ? meal.afterPhotoUrl : meal.beforePhotoUrl;
  if (!blobUrl) {
    return new NextResponse("No photo for this phase", { status: 404 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const upstream = await fetch(blobUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!upstream.ok) {
    console.error(
      "[snap-photo] upstream fetch failed",
      upstream.status,
      upstream.statusText,
    );
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "image/jpeg";
  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "content-type": contentType,
      /* Browser may cache for 5 min — same image rarely re-rendered. */
      "cache-control": "private, max-age=300",
    },
  });
}
