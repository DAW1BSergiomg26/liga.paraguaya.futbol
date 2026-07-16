import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StripesBackground from "@/components/layout/StripesBackground";
import Providers from "./providers";
import PushSetup from "@/components/PushSetup";

const inter = Inter({ subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: "Liga Paraguaya de Fútbol",
  description: "Clubes, partidos, tabla de posiciones y datos base del fútbol paraguayo.",
  icons: "/favicon.svg",
  metadataBase: new URL("https://ligapy.com"),
  openGraph: {
    title: "Liga Paraguaya de Fútbol",
    description: "Clubes, partidos, tabla de posiciones y datos base del fútbol paraguayo.",
    siteName: "Liga PY",
    locale: "es_PY",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${barlowCondensed.variable} bg-bg-primario text-texto-principal min-h-screen flex flex-col`}>
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
