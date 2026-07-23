import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle: string;
  trend?: number;
  accent?: "primary" | "accent" | "warning" | "destructive" | "success";
  index?: number;
}

const accentMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "from-primary/30 to-primary/0 text-primary",
  accent: "from-accent/30 to-accent/0 text-accent",
  warning: "from-warning/30 to-warning/0 text-warning",
  destructive: "from-destructive/30 to-destructive/0 text-destructive",
  success: "from-success/30 to-success/0 text-success",
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  accent = "primary",
  index = 0,
}: KpiCardProps) {
  const positive = (trend ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="glass group relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-70",
          accentMap[accent],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-secondary/60", accentMap[accent].split(" ").pop())}>
          <Icon className="h-5 w-5" />
        </div>
        {typeof trend === "number" && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}
