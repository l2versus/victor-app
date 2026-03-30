import type { Metadata } from "next"
import { ResultClient } from "./result-client"

export const metadata: Metadata = {
  title: "Resultado do Pagamento | Victor App",
}

export default function ResultPage() {
  return <ResultClient />
}
