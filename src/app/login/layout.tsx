import type { Metadata } from "next"
import { BRAND } from "@/lib/branding"

export const metadata: Metadata = {
  title: "Entrar",
  description:
    `Acesse sua conta na plataforma ${BRAND.appName}. Treinos personalizados, acompanhamento inteligente e evolução real com ${BRAND.trainerName}.`,
  alternates: {
    canonical: "/login",
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
