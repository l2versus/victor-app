import { NextRequest, NextResponse } from "next/server"
import { verifyToken, validateSession } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  // Public routes — no auth needed
  const publicPaths = ["/login", "/register", "/cadastro", "/victoroliveira", "/api/auth", "/api/webhooks", "/api/spotify/callback", "/api/spotify/login"]
  if (publicPaths.some((p) => pathname.startsWith(p)) || pathname === "/") {
    return NextResponse.next()
  }

  // API routes — check token
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    // Validate session version
    const apiSessionValid = await validateSession(payload)
    if (!apiSessionValid) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }
    // Admin-only routes
    if (pathname.startsWith("/api/admin") && payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.next()
  }

  // Page routes — redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = verifyToken(token)
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.set("token", "", { maxAge: 0, path: "/" })
    return response
  }

  // Validate session version
  const pageSessionValid = await validateSession(payload)
  if (!pageSessionValid) {
    const expiredResponse = NextResponse.redirect(new URL("/login?expired=1", request.url))
    expiredResponse.cookies.set("token", "", { maxAge: 0, path: "/" })
    return expiredResponse
  }

  // Role-based routing
  if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/today", request.url))
  }
  if (pathname.startsWith("/student") && payload.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|exercises).*)",
  ],
}
