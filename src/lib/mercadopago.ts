import { MercadoPagoConfig, Preference, Payment } from "mercadopago"
import { addMonths } from "date-fns"

// Lazy initialization to avoid build-time errors when env vars are empty
let _client: MercadoPagoConfig | null = null
function getClient(): MercadoPagoConfig {
  if (!_client) {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured")
    }
    _client = new MercadoPagoConfig({ accessToken: token })
  }
  return _client
}

export function getPreferenceClient() {
  return new Preference(getClient())
}

export function getPaymentClient() {
  return new Payment(getClient())
}

// Plan interval → duration in months
export function intervalToMonths(interval: string): number {
  switch (interval) {
    case "MONTHLY": return 1
    case "QUARTERLY": return 3
    case "SEMIANNUAL": return 6
    case "ANNUAL": return 12
    default: return 1
  }
}

// Calculate subscription end date from plan interval (uses date-fns to handle month-end edge cases)
export function calculateEndDate(startDate: Date, interval: string): Date {
  return addMonths(startDate, intervalToMonths(interval))
}
