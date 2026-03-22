import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Provodnik — экскурсии и туры по России",
  description:
    "Онлайн‑сервис бронирования экскурсий и авторских туров по России с местными гидами, понятной программой и прозрачными правилами.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
