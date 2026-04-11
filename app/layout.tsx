import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Los Toreto",
  description: "Sistema de Gestión Los Toreto",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-512.png",
  }
};

export const viewport = {
  themeColor: "#4338ca",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <main className="container animate-fade-in">
          {children}
        </main>
      </body>
    </html>
  );
}
