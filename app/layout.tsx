import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import "@/lib/config"; // validates all required env vars at startup — throws on missing

export const metadata: Metadata = {
  title: "TAP - Comercios",
  description: "App para administrar comercios TAP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body>
        {/* Providers ya maneja Theme + sesión reactiva */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

