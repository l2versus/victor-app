// Branding config — change these values to white-label the entire app
export const BRAND = {
  // Trainer identity
  trainerName: "Victor Oliveira",
  trainerFirstName: "Victor",
  trainerTitle: "Personal Trainer",
  trainerCref: "CREF 016254-G/CE",
  trainerCity: "Fortaleza/CE",
  trainerSpecialties: "hipertrofia e emagrecimento",
  trainerExperience: "metodologia baseada em ciência e tecnologia",

  // App identity
  appName: "Victor App",
  appDescription:
    "Plataforma de treinos personalizados com máquinas 3D, IA e correção postural. Treinos sob medida, acompanhamento inteligente e evolução real.",
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL || "https://victor-app-seven.vercel.app",

  // Contact
  instagram: "@victoroliveirapersonal_",
  whatsapp: "5585996985823",
  whatsappFormatted: "(85) 9.9698-5823",
  emailFrom: "Victor App <onboarding@resend.dev>",

  // Visual
  accentColor: "#dc2626",

  // AI
  aiAssistantName: "Victor Virtual",
  aiGreeting: "Sou o assistente virtual do personal trainer",
} as const

export type Brand = typeof BRAND

/** WhatsApp link with pre-filled message */
export function whatsappLink(message: string): string {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}`
}
