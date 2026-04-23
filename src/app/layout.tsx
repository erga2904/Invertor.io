import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppTour from '@/components/AppTour';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventor.io - Dasbor",
  description: "Dasbor sistem inventaris",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        <AppTour runOnMount={true} />
        {children}
      </body>
    </html>
  );
}
