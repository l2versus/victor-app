import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JsonLd } from "@/components/seo/json-ld";
import PWAProvider from "@/components/pwa-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Victor App";
const APP_DESCRIPTION =
  "Plataforma de treinos personalizados por Victor Oliveira. Treinos sob medida, acompanhamento inteligente e evolução real.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://victorapp.com.br";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Personal Trainer`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "personal trainer",
    "treino personalizado",
    "Victor Oliveira",
    "personal trainer Fortaleza",
    "treino online",
    "plano de treino",
    "musculação",
    "emagrecimento",
    "hipertrofia",
    "acompanhamento fitness",
    "app de treino",
  ],
  authors: [{ name: "Victor Oliveira", url: APP_URL }],
  creator: "Victor Oliveira",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Personal Trainer`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Victor Oliveira — Personal Trainer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Personal Trainer`,
    description: APP_DESCRIPTION,
    images: ["/og-image.jpg"],
    creator: "@victoroliveirapersonal_",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd />
        <PWAProvider />
        {children}
      </body>
    </html>
  );
}
