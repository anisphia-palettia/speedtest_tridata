import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpeedTest — Tridata",
  description: "Uji kecepatan jaringan internet Anda secara akurat dengan SpeedTest Tridata. Cek ping, download, dan upload speed secara real-time.",
  keywords: ["speedtest", "internet speed", "network test", "Tridata", "uji kecepatan internet"],
  authors: [{ name: "Tridata" }],
  openGraph: {
    title: "SpeedTest — Tridata",
    description: "Uji kecepatan jaringan internet Anda secara akurat. Cek ping, download, dan upload speed.",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "SpeedTest — Tridata",
    description: "Uji kecepatan jaringan internet Anda secara akurat. Cek ping, download, dan upload speed.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
