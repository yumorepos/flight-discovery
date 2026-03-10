import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "FlightFinder – Discover Amazing Flight Deals",
  description: "Find the best flight deals from your city. Real-time deal scoring, value rankings, and price alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`} style={{ fontFamily: 'var(--font-inter)' }}>
        {children}
      </body>
    </html>
  );
}
