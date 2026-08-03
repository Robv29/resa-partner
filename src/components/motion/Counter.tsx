"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";

// Petit "count-up" pour les chiffres clés du dashboard (CA, nb de
// nettoyages...). Purement décoratif — la valeur finale est toujours celle
// passée en props, jamais recalculée côté client.
export default function Counter({
  value,
  format = (n: number) => Math.round(n).toString(),
  duration = 0.9,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
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
      {format(display)}
    </span>
  );
}
