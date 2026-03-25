import { prisma } from "@/lib/prisma"

/**
 * Send a social notification (like, comment, follow, mention).
 * Silently fails — never blocks the main action.
 */
export async function notifySocial(params: {
  toUserId: string
  fromUserId?: string
  fromStudentId?: string
  fromName: string
  type: "social_like" | "social_comment" | "social_follow" | "social_mention"
  postId?: string
  postContent?: string
  commentContent?: string
}) {
  try {
    const { toUserId, fromName, fromStudentId, type, postId, postContent, commentContent } = params

    // Don't notify yourself
    if (params.fromUserId && params.fromUserId === toUserId) return

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
      case "social_mention":
        title = `${fromName} mencionou você`
        body = commentContent ? `"${commentContent.slice(0, 80)}${commentContent.length > 80 ? "..." : ""}"` : "Mencionou você em um comentário"
        break
    }

    await prisma.notification.create({
      data: {
        userId: toUserId,
        type,
        title,
        body,
        metadata: { fromName, fromStudentId, type, postId },
      },
    })
  } catch {
    // Silent fail — social notifications should never block
  }
}

/**
 * Parse @mentions from text and notify mentioned users.
 * Silently fails.
 */
export async function notifyMentions(params: {
  text: string
  fromUserId: string
  fromName: string
  postId?: string
}) {
  try {
    const { text, fromUserId, fromName, postId } = params
    const mentions = text.match(/@(\w[\w.]*)/g)
    if (!mentions || mentions.length === 0) return

    const mentionNames = mentions.map(m => m.slice(1)) // remove @

    // Find students matching any of the mentioned names (first name match)
    for (const mentionName of mentionNames) {
      const matchingStudents = await prisma.student.findMany({
        where: {
          user: {
            name: { startsWith: mentionName, mode: "insensitive" },
          },
        },
        select: { id: true, userId: true },
        take: 1,
      })

      for (const student of matchingStudents) {
        if (student.userId !== fromUserId) {
          await notifySocial({
            toUserId: student.userId,
            fromUserId,
            fromStudentId: undefined,
            fromName,
            type: "social_mention",
            postId,
            commentContent: text,
          })
        }
      }
    }
  } catch {
    // Silent fail
  }
}
