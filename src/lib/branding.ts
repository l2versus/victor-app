// Branding config — change these values to white-label the entire app
export const BRAND = {
  // Trainer identity
  trainerName: "Victor Oliveira",
  trainerTitle: "Personal Trainer",
  trainerCref: "CREF 123456-G/CE",

  // App identity
  appName: "Ironberg App",
  appDescription:
    "Plataforma de treinos personalizados com máquinas 3D, IA e correção postural. Treinos sob medida, acompanhamento inteligente e evolução real.",
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL || "https://victor-app-seven.vercel.app",

  // Social
  instagram: "@victoroliveirapersonal_",
  whatsapp: "",

  // Visual
  accentColor: "#dc2626",

  // AI
  aiAssistantName: "Victor Virtual",
  aiGreeting: "Sou o assistente virtual do personal trainer",
} as const

export type Brand = typeof BRAND
