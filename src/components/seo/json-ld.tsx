const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://victorapp.com.br"

// All values are static constants — no user input involved, safe from XSS
const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Victor Oliveira",
  jobTitle: "Personal Trainer",
  url: APP_URL,
  image: `${APP_URL}/victor-profile.jpg`,
  sameAs: [
    "https://instagram.com/victoroliveirapersonal_",
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
