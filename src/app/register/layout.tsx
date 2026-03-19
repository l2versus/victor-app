import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    "Crie sua conta na Victor App. Comece sua transformação com treinos personalizados pelo personal trainer Victor Oliveira.",
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
