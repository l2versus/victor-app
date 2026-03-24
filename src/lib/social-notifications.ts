import { prisma } from "@/lib/prisma"

/**
 * Send a social notification (like, comment, follow).
 * Silently fails — never blocks the main action.
 */
export async function notifySocial(params: {
  toUserId: string
  fromName: string
  type: "social_like" | "social_comment" | "social_follow"
  postContent?: string
  commentContent?: string
}) {
  try {
    // Don't notify yourself
    const { toUserId, fromName, type, postContent, commentContent } = params

    let title = ""
    let body = ""

    switch (type) {
      case "social_like":
        title = `${fromName} curtiu seu post`
        body = postContent ? `"${postContent.slice(0, 60)}${postContent.length > 60 ? "..." : ""}"` : "Curtiu sua publicação"
        break
      case "social_comment":
        title = `${fromName} comentou`
        body = commentContent ? `"${commentContent.slice(0, 80)}${commentContent.length > 80 ? "..." : ""}"` : "Comentou na sua publicação"
        break
      case "social_follow":
        title = `${fromName} começou a te seguir`
        body = "Toque para ver o perfil"
        break
    }

    await prisma.notification.create({
      data: {
        userId: toUserId,
        type,
        title,
        body,
        metadata: { fromName, type },
      },
    })
  } catch {
    // Silent fail — social notifications should never block
  }
}
