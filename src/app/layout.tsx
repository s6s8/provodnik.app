import type { Metadata } from "next";
import { Geist_Mono, Onest } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-onest",
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
    <html lang="ru" className={`${onest.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
