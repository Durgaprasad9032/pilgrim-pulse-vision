import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { usePredictionSocket } from "@/hooks/usePredictionSocket";
import { PredictionZone } from "@/services/predictionApi";
import { cn } from "@/lib/utils";

// Risk Level color coding
const riskBadgeStyles: Record<string, string> = {
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  MODERATE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CRITICAL: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

const riskProgressColors: Record<string, string> = {
  LOW: "bg-emerald-500",
  MODERATE: "bg-amber-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-rose-500",
};

function formatTimestamp(isoOrDate: string | Date | null): string {
  if (!isoOrDate) return "—";
  try {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(isoOrDate);
  }
}

export function PredictionPanel() {
  const { prediction, status, connected, loading, error, lastUpdated, refetch } =
    usePredictionSocket();

  const zones: PredictionZone[] = prediction?.zones ?? [];
  const predictionTimestamp = formatTimestamp(prediction?.timestamp || lastUpdated);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      {/* Header with Title & Badges */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary via-accent to-purple-600 shadow-md">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight">AI Crowd Density Predictions</h3>
              {/* XGBoost AI Badge */}
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300 shadow-sm">
                <Zap className="h-3 w-3 text-purple-400" />
                Powered by XGBoost AI
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              60-minute predictive horizon · Real-time WebSocket streaming
            </p>
          </div>
        </div>

        {/* Action & Real-Time Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Real-time Connection Status Indicator */}
          {connected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <Wifi className="h-3 w-3" />
              🟢 Live
            </span>
          ) : status === "reconnecting" || status === "connecting" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400 shadow-sm">
              <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
              🟡 Reconnecting...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400 shadow-sm">
              <WifiOff className="h-3 w-3" />
              🔴 REST Fallback
            </span>
          )}

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-accent" />
            Last updated: <strong className="text-foreground">{predictionTimestamp}</strong>
          </span>

          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary/70 active:scale-95 disabled:opacity-50"
            title="Refresh connection or fetch predictions"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-primary", loading && "animate-spin")} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Connection Warning / Fallback Alert */}
      {error && !prediction && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Connection Warning:</strong> {error}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="rounded-md bg-destructive/20 px-2.5 py-1 text-xs font-semibold hover:bg-destructive/30"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading State Skeleton */}
      {loading && !prediction && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-border/50 bg-secondary/20 p-4"
            />
          ))}
        </div>
      )}

      {/* Live AI Predictions Grid */}
      {zones.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => {
            const riskUpper = (zone.risk_level || "LOW").toUpperCase();
            const badgeStyle =
              riskBadgeStyles[riskUpper] ||
              "bg-secondary/40 text-muted-foreground border-border";
            const progressColor = riskProgressColors[riskUpper] || "bg-primary";
            const confidencePct = Math.round(
              zone.confidence_score > 1 ? zone.confidence_score : zone.confidence_score * 100
            );
            const isIncreasing = zone.trend.toLowerCase() === "increasing";
            const isDecreasing = zone.trend.toLowerCase() === "decreasing";

            return (
              <motion.div
                key={zone.zone_id || zone.zone_name}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-secondary/30 p-4.5 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-secondary/50 hover:shadow-lg"
              >
                <div>
                  {/* Card Header: Zone Name + Risk Level Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {zone.zone_name}
                    </h4>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase",
                        badgeStyle
                      )}
                    >
                      {riskUpper}
                    </span>
                  </div>

                  {/* Confidence & Trend Badges */}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Confidence: <strong className="text-foreground">{confidencePct}%</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
                      {isIncreasing ? (
                        <TrendingUp className="h-3 w-3 text-rose-400" />
                      ) : isDecreasing ? (
                        <TrendingDown className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Activity className="h-3 w-3 text-accent" />
                      )}
                      Trend: <strong className="text-foreground capitalize">{zone.trend}</strong>
                    </span>
                  </div>

                  {/* Density Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
                    <div>
                      <span className="text-[11px] text-muted-foreground">Predicted Density</span>
                      <p className="mt-0.5 text-lg font-bold text-foreground">
                        {zone.predicted_density_p_m2.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">p/m²</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">Est. Pilgrim Count</span>
                      <p className="mt-0.5 text-lg font-bold text-foreground flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary shrink-0" />
                        {zone.predicted_crowd_count.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Density Bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Density Capacity Load</span>
                    <span>{Math.min(100, Math.round((zone.predicted_density_p_m2 / 5.0) * 100))}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full transition-all duration-500", progressColor)}
                      style={{
                        width: `${Math.min(100, Math.max(5, (zone.predicted_density_p_m2 / 5.0) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State Fallback */}
      {!loading && zones.length === 0 && !error && (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No zone predictions available at this time. Click refresh to query the AI backend.
        </div>
      )}
    </motion.section>
  );
}
