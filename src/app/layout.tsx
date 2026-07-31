import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VGS Autos — Réservation nettoyage",
  description: "Espace de réservation et de suivi du nettoyage automobile VGS Autos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
