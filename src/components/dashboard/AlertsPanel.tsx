import { motion } from "framer-motion";
import { AlertTriangle, Brain, ListChecks, TrendingUp, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/simulation/hooks";
import { SCENARIOS } from "@/simulation/engine";

interface Section {
  title: string;
  icon: LucideIcon;
  tone: "destructive" | "warning" | "primary" | "accent";
  items: { title: string; meta: string }[];
}

const toneMap = {
  destructive: "text-destructive bg-destructive/10 border-destructive/30",
  warning: "text-warning bg-warning/10 border-warning/30",
  primary: "text-primary bg-primary/10 border-primary/30",
  accent: "text-accent bg-accent/10 border-accent/30",
} as const;

export function AlertsPanel() {
  const sim = useSimulation();

  const sections = useMemo<Section[]>(() => {
    const hot = sim.locations
      .filter((l) => l.load >= 0.75)
      .sort((a, b) => b.load - a.load);
    const rising = sim.locations
      .filter((l) => l.load >= 0.45 && l.load < 0.75)
      .sort((a, b) => b.load - a.load);

    const congestionItems = hot.length
      ? hot.slice(0, 2).map((l) => ({
          title: `${l.label} exceeding ${Math.round(l.load * 100)}% capacity`,
          meta: `${l.count.toLocaleString()} / ${l.capacity.toLocaleString()} agents`,
        }))
      : [{ title: "All zones nominal", meta: "No breaches detected" }];

    const scenario = SCENARIOS[sim.scenario];
    const predictionItems = [
      {
        title: `${sim.activeAgents.toLocaleString()} active · ${sim.exitedAgents.toLocaleString()} exited`,
        meta: `Scenario: ${sim.scenario} · ${scenario.agentCount.toLocaleString()} total agents`,
      },
      {
        title: `Congestion index ${sim.congestionIndex} / 100 (${sim.congestionLabel})`,
        meta: `Predicted window: next 30 min`,
      },
    ];

    const actionItems = hot.length
      ? [
          {
            title: `Divert inflow away from ${hot[0].label}`,
            meta: `Open auxiliary route · relief ~6 min`,
          },
          {
            title: `Open additional lanes at ${hot[0].label}`,
            meta: `Requires manual approval`,
          },
        ]
      : [
          { title: "Maintain current routing", meta: "No intervention required" },
          { title: "Monitor Darshan Queue throughput", meta: "Auto-review in 5 min" },
        ];

    const riskItems = rising.length
      ? rising.slice(0, 2).map((l) => ({
          title: `${l.label} approaching threshold`,
          meta: `${Math.round(l.load * 100)}% load · trending up`,
        }))
      : [{ title: "No zones approaching threshold", meta: "Stable inflow" }];

    return [
      { title: "Congestion Alerts", icon: AlertTriangle, tone: "destructive", items: congestionItems },
      { title: "Prediction Summary", icon: Brain, tone: "primary", items: predictionItems },
      { title: "Recommended Actions", icon: ListChecks, tone: "accent", items: actionItems },
      { title: "Upcoming Risk Areas", icon: TrendingUp, tone: "warning", items: riskItems },
    ];
  }, [sim]);

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
