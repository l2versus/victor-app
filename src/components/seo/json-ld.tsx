import { BRAND } from "@/lib/branding"

const APP_URL = BRAND.appUrl

// All values are static constants — no user input involved, safe from XSS
const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: BRAND.trainerName,
  jobTitle: BRAND.trainerTitle,
  url: APP_URL,
  image: `${APP_URL}/victor-profile.jpg`,
  sameAs: [
    `https://instagram.com/${BRAND.instagram.replace("@", "")}`,
  ],
  knowsAbout: [
    "Musculação",
    "Treino personalizado",
    "Emagrecimento",
    "Hipertrofia",
    "Nutrição esportiva",
  ],
}

const jsonLdString = JSON.stringify(jsonLdData)

export function JsonLd() {
  // dangerouslySetInnerHTML is safe here: jsonLdString contains only
  // hardcoded static data with no user-supplied values.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
    />
  )
}
