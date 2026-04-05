import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JsonLd } from "@/components/seo/json-ld";
import PWAProvider from "@/components/pwa-provider";
import { BRAND } from "@/lib/branding";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
});

const APP_NAME = BRAND.appName;
const APP_DESCRIPTION = BRAND.appDescription;
const APP_URL = BRAND.appUrl;

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${BRAND.trainerTitle}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "personal trainer",
    "treino personalizado",
    BRAND.trainerName,
    "personal trainer Fortaleza",
    "treino online",
    "plano de treino",
    "musculação",
    "emagrecimento",
    "hipertrofia",
    "acompanhamento fitness",
    "app de treino",
  ],
  authors: [{ name: BRAND.trainerName, url: APP_URL }],
  creator: BRAND.trainerName,
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — ${BRAND.trainerTitle}`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${BRAND.trainerName} — ${BRAND.trainerTitle}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${BRAND.trainerTitle}`,
    description: APP_DESCRIPTION,
    images: ["/og-image.jpg"],
    creator: BRAND.instagram,
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
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        {/* Global modal portal — outside ALL stacking contexts */}
        <div id="modal-portal" />
      </body>
    </html>
  );
}
