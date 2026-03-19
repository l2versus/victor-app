import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse sua conta na plataforma Victor App. Treinos personalizados, acompanhamento inteligente e evolução real com Victor Oliveira.",
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
