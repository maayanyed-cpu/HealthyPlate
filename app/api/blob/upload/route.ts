import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/* Mints a short-lived upload token for the client SDK.
   Client side calls @vercel/blob/client.upload({ handleUploadUrl: '/api/blob/upload' }). */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
        maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB — enough for a phone photo
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        /* No-op for v0. Could log or post-process here. */
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
