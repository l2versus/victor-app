import type { MetadataRoute } from "next"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://victorapp.com.br"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/today", "/history", "/chat", "/profile"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
