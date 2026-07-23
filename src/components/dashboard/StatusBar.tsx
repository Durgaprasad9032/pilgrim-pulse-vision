import { Activity, Cpu, Timer, Users } from "lucide-react";
import { useSimulation } from "@/simulation/hooks";

export function StatusBar() {
  const sim = useSimulation();
  const statusLabel =
    sim.status === "running" ? "Running" : sim.status === "paused" ? "Paused" : "Idle";
  const statusTone =
    sim.status === "running"
      ? "text-success"
      : sim.status === "paused"
        ? "text-warning"
        : "text-muted-foreground";

  const items = [
    { icon: Activity, label: "Simulation", value: statusLabel, tone: statusTone },
    {
      icon: Users,
      label: "Virtual Devotees",
      value: sim.activeAgents.toLocaleString(),
      tone: "text-primary",
    },
    { icon: Timer, label: "Prediction Window", value: "30 min", tone: "text-accent" },
    {
      icon: Cpu,
      label: "Model Status",
      value: `TwinNet-v3 · ${sim.congestionLabel}`,
      tone: sim.congestionLabel === "Critical" ? "text-destructive" : "text-success",
    },
  ];

  return (
    <div className="glass flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-4 py-2.5 text-xs">
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 items-center gap-2">
          <it.icon className={`h-3.5 w-3.5 shrink-0 ${it.tone}`} />
          <span className="text-muted-foreground">{it.label}:</span>
          <span className="truncate font-medium">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
