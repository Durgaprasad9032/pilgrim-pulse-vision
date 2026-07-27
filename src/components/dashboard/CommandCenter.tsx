import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  MapPin,
  Route,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/simulation/hooks";
import type { AlertSeverity, RouteHealthStatus, SystemStatus } from "@/simulation/types";

import { usePredictions } from "@/hooks/usePredictions";

const statusTone: Record<SystemStatus, string> = {
  Normal: "bg-success/15 text-success border-success/30",
  Elevated: "bg-warning/15 text-warning border-warning/30",
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
};

const alertTone: Record<AlertSeverity, string> = {
  Info: "border-border bg-secondary/40",
  Warning: "border-warning/30 bg-warning/10",
  Critical: "border-destructive/30 bg-destructive/10",
};

const routeStatusColor: Record<RouteHealthStatus, string> = {
  Optimal: "text-success",
  Recommended: "text-primary",
  Moderate: "text-accent",
  Busy: "text-warning",
  Critical: "text-destructive",
  Blocked: "text-muted-foreground line-through",
};

function formatMin(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function CommandCenter() {
  const sim = useSimulation();
  const { data: aiPredictions } = usePredictions();
  const cc = sim.intelligence.commandCenter;
  const intel = sim.intelligence;
  const aiZones = aiPredictions?.zones ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Live Command Center</h3>
            <p className="text-[11px] text-muted-foreground">
              Intelligent crowd management · XGBoost model confidence {aiPredictions?.zones[0]?.confidence_score ? Math.round(aiPredictions.zones[0].confidence_score * 100) + "%" : intel.overallConfidence}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold",
            statusTone[cc.systemStatus],
          )}
        >
          {cc.systemStatus.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Predictions + route summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">XGBoost Predictions</h4>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                AI Live
              </span>
            </div>
            <ul className="space-y-2">
              {aiZones.length > 0
                ? aiZones.map((z) => (
                    <li
                      key={z.zone_id || z.zone_name}
                      className="flex items-center justify-between rounded-lg bg-background/50 px-2.5 py-1.5 text-xs"
                    >
                      <span className="font-medium truncate max-w-[110px]">{z.zone_name}</span>
                      <span className="text-muted-foreground">{z.predicted_density_p_m2.toFixed(2)} p/m²</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase",
                          z.risk_level === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : z.risk_level === "HIGH"
                            ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                            : z.risk_level === "MODERATE"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        )}
                      >
                        {z.risk_level}
                      </span>
                    </li>
                  ))
                : intel.predictions.map((p) => (
                    <li
                      key={p.horizonMinutes}
                      className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-xs"
                    >
                      <span className="text-muted-foreground">+{p.horizonMinutes} min</span>
                      <span className="font-medium">{p.expectedCrowd.toLocaleString()} crowd</span>
                      <span className="text-muted-foreground">{p.expectedCongestion}% congestion</span>
                    </li>
                  ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-muted-foreground">Best Route</p>
              <p className="mt-1 font-semibold text-success">
                {cc.bestRoute?.label ?? "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Score {cc.bestRoute?.healthScore ?? 0}/100
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-muted-foreground">Worst Route</p>
              <p className="mt-1 font-semibold text-destructive">
                {cc.worstRoute?.label ?? "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Score {cc.worstRoute?.healthScore ?? 0}/100
              </p>
            </div>
          </div>
        </div>

        {/* Route health + analytics */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Route className="h-4 w-4 text-accent" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Route Health</h4>
            </div>
            <ul className="max-h-48 space-y-1.5 overflow-y-auto">
              {intel.routeHealth.map((r) => (
                <li
                  key={r.routeId}
                  className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-[11px]"
                >
                  <span className="font-medium">{r.label}</span>
                  <span className={cn("font-semibold", routeStatusColor[r.status])}>
                    {r.status}
                  </span>
                  <span className="text-muted-foreground">{r.loadPercent}%</span>
                  <span className="text-muted-foreground">{formatMin(r.travelTimeSeconds)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Live Analytics</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <dt className="text-muted-foreground">Avg travel</dt>
              <dd className="text-right font-medium">
                {formatMin(intel.analytics.avgTravelTimeSeconds)}
              </dd>
              <dt className="text-muted-foreground">Served/min</dt>
              <dd className="text-right font-medium">{intel.analytics.peopleServedPerMinute}</dd>
              <dt className="text-muted-foreground">Queue throughput</dt>
              <dd className="text-right font-medium">{intel.analytics.queueThroughput}%</dd>
              <dt className="text-muted-foreground">Rerouted</dt>
              <dd className="text-right font-medium">{intel.analytics.reroutedDevotees}</dd>
              <dt className="text-muted-foreground">Top route</dt>
              <dd className="text-right font-medium capitalize">{intel.analytics.mostUsedRoute}</dd>
            </dl>
          </div>
        </div>

        {/* Alerts + actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Smart Alerts</h4>
            </div>
            <ul className="max-h-36 space-y-1.5 overflow-y-auto">
              {cc.alerts.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className={cn("rounded-lg border px-3 py-2 text-[11px]", alertTone[a.severity])}
                >
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-0.5 text-muted-foreground">{a.message}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Suggested Actions</h4>
            </div>
            <ul className="space-y-1.5">
              {cc.suggestedActions.slice(0, 4).map((rec) => (
                <li
                  key={rec.id}
                  className="flex items-start gap-2 rounded-lg bg-background/50 px-3 py-2 text-[11px]"
                >
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{rec.action}</p>
                    <p className="text-muted-foreground">{rec.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {cc.mostCrowdedLocation && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px]">
              <MapPin className="h-3.5 w-3.5 text-warning" />
              <span>
                Most crowded: <strong>{cc.mostCrowdedLocation.label}</strong> (
                {Math.round(cc.mostCrowdedLocation.load * 100)}%)
              </span>
            </div>
          )}

          {cc.activeIncidents.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px]">
              <span className="font-medium text-destructive">Active incidents: </span>
              {cc.activeIncidents.join(" · ")}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
