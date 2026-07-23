import { motion } from "framer-motion";
import { AlertTriangle, Brain, ListChecks, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  title: string;
  icon: LucideIcon;
  tone: "destructive" | "warning" | "primary" | "accent";
  items: { title: string; meta: string }[];
}

const sections: Section[] = [
  {
    title: "Congestion Alerts",
    icon: AlertTriangle,
    tone: "destructive",
    items: [
      { title: "Darshan Queue exceeding 92% capacity", meta: "Sector 4 · 2 min ago" },
      { title: "Bottleneck detected near Gate B", meta: "Sector 2 · 6 min ago" },
    ],
  },
  {
    title: "Prediction Summary",
    icon: Brain,
    tone: "primary",
    items: [
      { title: "+18% inflow expected in next 30 minutes", meta: "Model: TwinNet-v3" },
      { title: "Peak crowd window: 17:40 – 18:20", meta: "Confidence 94%" },
    ],
  },
  {
    title: "Recommended Actions",
    icon: ListChecks,
    tone: "accent",
    items: [
      { title: "Divert inflow via Route R-7 (North Loop)", meta: "ETA relief: 6 min" },
      { title: "Open auxiliary queue lane Q-3", meta: "Manual approval" },
    ],
  },
  {
    title: "Upcoming Risk Areas",
    icon: TrendingUp,
    tone: "warning",
    items: [
      { title: "Prasadam Hall likely to breach threshold", meta: "in ~22 min" },
      { title: "Exit Gate 3 crowd pressure rising", meta: "in ~35 min" },
    ],
  },
];

const toneMap = {
  destructive: "text-destructive bg-destructive/10 border-destructive/30",
  warning: "text-warning bg-warning/10 border-warning/30",
  primary: "text-primary bg-primary/10 border-primary/30",
  accent: "text-accent bg-accent/10 border-accent/30",
} as const;

export function AlertsPanel() {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((s, si) => (
        <motion.section
          key={s.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.06 }}
          className="glass rounded-2xl p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className={cn("grid h-8 w-8 place-items-center rounded-lg border", toneMap[s.tone])}>
              <s.icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight">{s.title}</h3>
          </div>
          <ul className="space-y-2">
            {s.items.map((it) => (
              <li
                key={it.title}
                className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs"
              >
                <p className="font-medium text-foreground">{it.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{it.meta}</p>
              </li>
            ))}
          </ul>
        </motion.section>
      ))}
    </div>
  );
}
