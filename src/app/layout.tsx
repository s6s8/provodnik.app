import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const dmSans = DM_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const cormorantGaramond = Cormorant_Garamond({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://provodnik.app"),
  title: {
    default: "Provodnik — Найди своего гида",
    template: "%s — Provodnik",
  },
  description: "Маркетплейс частных экскурсий и гидов по России",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Provodnik",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${dmSans.variable} ${cormorantGaramond.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
