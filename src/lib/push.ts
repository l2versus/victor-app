import webpush from "web-push"
import { prisma } from "@/lib/prisma"

/**
 * Send a web push notification to a specific student.
 * Silently fails — never blocks the main action.
 * Auto-cleans expired subscriptions (410 Gone).
 */
export async function sendPushToStudent(
  studentId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<boolean> {
  try {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT
    if (!vapidPublic || !vapidPrivate || !vapidSubject) return false

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

    const subs = await prisma.pushSubscription.findMany({ where: { studentId } })
    let sent = false

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ ...payload, url: payload.url || "/community" })
        )
        sent = true
      } catch (err: unknown) {
        if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    }
    return sent
  } catch (err) {
    console.error("[Push] sendPushToStudent failed:", err)
    return false
  }
}

/**
 * Send push to all followers of a student.
 * Used when someone creates a new post.
 */
export async function pushToFollowers(
  studentId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<number> {
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: studentId },
      select: { followerId: true },
    })

    let sentCount = 0
    for (const f of followers) {
      const sent = await sendPushToStudent(f.followerId, payload)
      if (sent) sentCount++
    }
    return sentCount
  } catch (err) {
    console.error("[Push] pushToFollowers failed:", err)
    return 0
  }
}
