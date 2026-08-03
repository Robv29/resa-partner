"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// Entrée douce (fondu + léger décalage vers le haut), utilisée pour donner
// un peu de vie à l'arrivée sur chaque page/section, sans jamais bloquer le
// contenu derrière l'animation (le contenu est déjà dans le DOM, juste
// animé). Respecte prefers-reduced-motion via useReducedMotion().
export default function Reveal({
  children,
  delay = 0,
  y = 10,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0.01 : 0.5, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

// Conteneur qui décale l'apparition de ses enfants directs les uns après les
// autres (listes de réservations, cartes de stats...). Chaque enfant doit
// être un <StaggerItem>.
export function StaggerGroup({
  children,
  className,
  staggerDelay = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 10 }: { children: React.ReactNode; className?: string; y?: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: shouldReduceMotion ? 0.01 : 0.4, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Variantes pour <table> : motion.tbody / motion.tr restent de vrais éléments
// HTML (framer-motion anime l'élément réel, pas un div de substitution), donc
// la sémantique et la mise en page du tableau restent intactes.
export function StaggerTBody({ children, className, staggerDelay = 0.05 }: { children: React.ReactNode; className?: string; staggerDelay?: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.tbody
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.tbody>
  );
}

export function StaggerRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.tr
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.tr>
  );
}
