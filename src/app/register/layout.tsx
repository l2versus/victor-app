import type { Metadata } from "next"
import { BRAND } from "@/lib/branding"

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    `Crie sua conta na ${BRAND.appName}. Comece sua transformação com treinos personalizados pelo personal trainer ${BRAND.trainerName}.`,
  alternates: {
    canonical: "/register",
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
