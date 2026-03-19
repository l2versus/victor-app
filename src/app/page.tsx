import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()

  if (session) {
    if (session.role === "ADMIN") redirect("/admin/dashboard")
    redirect("/today")
  }

  redirect("/login")
}
