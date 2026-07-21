import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StripesBackground from "@/components/layout/StripesBackground";
import Providers from "./providers";
import PushSetup from "@/components/PushSetup";
import { SITE_URL, SITE_NAME, SITE_SHORT } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Datos y Estadísticas`,
    template: `%s | ${SITE_SHORT}`,
  },
  description:
    "Clubes, partidos, tabla de posiciones, goleadores, transferencias y datos del fútbol paraguayo en tiempo real.",
  keywords: [
    "fútbol paraguayo",
    "liga paraguaya",
    "primera división",
    "clubes",
    "partidos",
    "tabla de posiciones",
    "goleadores",
    "transferencias",
    "APF",
    "Cerro Porteño",
    "Olimpia",
    "Libertad",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_SHORT,
  publisher: SITE_SHORT,
  formatDetection: { telephone: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} | Datos y Estadísticas`,
    description:
      "Clubes, partidos, tabla de posiciones, goleadores, transferencias y datos del fútbol paraguayo en tiempo real.",
    url: SITE_URL,
    siteName: SITE_SHORT,
    locale: "es_PY",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Datos y Estadísticas`,
    description:
      "Clubes, partidos, tabla de posiciones, goleadores, transferencias y datos del fútbol paraguayo en tiempo real.",
    images: ["/og-image.png"],
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#CC001C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} ${barlowCondensed.variable} bg-bg-primario text-texto-principal min-h-screen flex flex-col antialiased`}>
        <StripesBackground />
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <PushSetup />
        </Providers>
      </body>
    </html>
  );
}
