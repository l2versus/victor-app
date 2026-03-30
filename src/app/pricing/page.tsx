import type { Metadata } from "next"
import { PricingClient } from "./pricing-client"

export const metadata: Metadata = {
  title: "Planos e Precos | Victor App",
  description:
    "Escolha o plano ideal para seus treinos. Comece gratis por 3 dias ou assine Premium, Pro ou Full com IA, nutricao e camera postural.",
}

export default function PricingPage() {
  return <PricingClient />
}
