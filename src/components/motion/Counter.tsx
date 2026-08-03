"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";
import { formatEUR } from "@/lib/format";

// Petit "count-up" pour les chiffres clés du dashboard (CA, nb de
// nettoyages...). Purement décoratif — la valeur finale est toujours celle
// passée en props, jamais recalculée côté client.
//
// `format` est une clé sérialisable (pas une fonction) : ce composant est
// rendu depuis des Server Components, et React interdit de passer une
// fonction en props d'un Server Component vers un Client Component (crash
// "Functions cannot be passed directly to Client Components" en prod).
const FORMATTERS: Record<string, (n: number) => string> = {
  number: (n) => Math.round(n).toString(),
  eur: formatEUR,
  percent: (n) => `${n.toFixed(0)}%`,
};

export default function Counter({
  value,
  format = "number",
  duration = 0.9,
}: {
  value: number;
  format?: "number" | "eur" | "percent";
  duration?: number;
}) {
  const formatFn = FORMATTERS[format] ?? FORMATTERS.number;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatFn(display)}
    </span>
  );
}
