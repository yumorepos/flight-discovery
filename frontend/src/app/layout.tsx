import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlightDiscovery – Discover Amazing Flight Deals",
  description:
    "Find flight deals by destination with value ranking, final pricing with taxes, and fare alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
