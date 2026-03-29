import type { Metadata } from "next"
import { FinanceMasterClient } from "./finance-master-client"

export const metadata: Metadata = {
  title: "Financeiro | Master",
  robots: { index: false, follow: false },
}

export default function MasterFinancePage() {
  return <FinanceMasterClient />
}
