import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { LoginForm } from "./login-form"
import { ActiveSessionBanner } from "./active-session-banner"

export default async function LoginPage() {
  const session = await getSession()

  return (
    <Suspense>
      {session && <ActiveSessionBanner role={session.role} />}
      <LoginForm />
    </Suspense>
  )
}
