"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyPlatesButton({ plates }: { plates: string[] }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(plates.join(", "));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1 text-xs text-accent-ink font-medium hover:underline shrink-0"
    >
      {copied ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <Copy className="h-3 w-3" strokeWidth={2} />}
      {copied ? "Copié" : `Copier (${plates.length})`}
    </button>
  );
}
