"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Petit clin d'œil ludique : le logo réagit légèrement au survol (léger
// tilt + zoom), au lieu de rester complètement statique dans l'en-tête.
export default function BrandBadge({ size = 28 }: { size?: number }) {
  return (
    <motion.span
      whileHover={{ rotate: -6, scale: 1.08 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
      className="flex items-center justify-center rounded-md bg-white p-1 shrink-0"
      style={{ height: size, width: size }}
    >
      <Image src="/logo-mark.png" alt="Résa Partner" width={size} height={size} className="h-full w-full object-contain" />
    </motion.span>
  );
}
