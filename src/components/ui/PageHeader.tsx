"use client";

import Reveal from "@/components/motion/Reveal";

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Reveal className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-ink tracking-[-0.01em]">{title}</h1>
        {description && <p className="text-sm text-ink-soft mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </Reveal>
  );
}
