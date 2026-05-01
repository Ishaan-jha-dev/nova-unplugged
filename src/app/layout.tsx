import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nova Unplugged 2025 | IIM Bangalore Annual Fest",
  description:
    "Nova Unplugged is the annual college fest of IIM Bangalore — June 2025. Register now for cultural, technical, and sports events. Gamified entry, QR-based access, and 1000+ participants.",
  keywords: ["IIM Bangalore", "college fest", "Nova Unplugged", "IIMB", "events 2025"],
  openGraph: {
    title: "Nova Unplugged 2025 | IIM Bangalore",
    description: "The annual fest of IIM Bangalore. June 2025.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="bg-nova-bg text-nova-text font-body antialiased">
        {children}
      </body>
    </html>
  );
}
