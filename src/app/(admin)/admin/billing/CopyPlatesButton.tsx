"use client";

import { useState } from "react";

export default function CopyPlatesButton({ plates }: { plates: string[] }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(plates.join(", "));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs text-brand-accent font-semibold hover:underline"
    >
      {copied ? "Copié ✓" : `Copier les ${plates.length} plaque(s)`}
    </button>
  );
}
