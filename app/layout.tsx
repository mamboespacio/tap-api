import type { Metadata } from "next";
import { Providers } from "./providers"; // ya adaptado a Supabase
import "./globals.css";

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

