import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// metadataBase est indispensable pour que les URLs d'image relatives
// (og-image, apple-touch-icon) soient résolues en URLs absolues dans les
// balises <meta> — sans ça, les aperçus de lien (iMessage, WhatsApp, Slack…)
// ne trouvent pas l'image et affichent une icône générique par défaut.
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://resa-partner.fr";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Résa Partner",
  description: "Espace de réservation et de suivi du nettoyage automobile, pour vos concessions partenaires.",
  icons: { icon: "/logo-mark.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "Résa Partner",
    description: "Espace de réservation et de suivi du nettoyage automobile, pour vos concessions partenaires.",
    siteName: "Résa Partner",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Résa Partner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Résa Partner",
    description: "Espace de réservation et de suivi du nettoyage automobile, pour vos concessions partenaires.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
