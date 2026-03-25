import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { requireAuth } from "@/lib/auth"

// Client-side upload — file goes DIRECTLY from browser to Blob storage
// No serverless body size limit (supports 4K video, any size)
export async function POST(req: Request) {
  try {
    // Auth check — only logged-in users can upload
    await requireAuth()

    const body = (await req.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"],
        maximumSizeInBytes: 100 * 1024 * 1024, // 100MB — supports 4K video
      }),
      onUploadCompleted: async () => {
        // Could log upload stats here if needed
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upload error"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
