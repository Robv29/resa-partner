import { Circle, CircleCheck, CircleDashed, CircleX } from "lucide-react";

const STATUS_MAP = {
  pending: { label: "En attente", classes: "bg-amber-50 text-amber-800 ring-amber-600/20", Icon: CircleDashed },
  scheduled: { label: "Planifié", classes: "bg-accent-soft text-accent-ink ring-accent/20", Icon: Circle },
  done: { label: "Terminé", classes: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", Icon: CircleCheck },
  cancelled: { label: "Annulé", classes: "bg-black/[0.04] text-ink-faint ring-black/5", Icon: CircleX },
} as const;

export type BookingStatus = keyof typeof STATUS_MAP;

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[(status as BookingStatus) in STATUS_MAP ? (status as BookingStatus) : "pending"];
  const { label, classes, Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
