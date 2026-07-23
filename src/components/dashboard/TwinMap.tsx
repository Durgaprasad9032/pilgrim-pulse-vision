import { motion } from "framer-motion";
import { Layers, Maximize2, MapPin, Radio } from "lucide-react";

const hotspots = [
  { top: "22%", left: "28%", level: "high", label: "Main Gate" },
  { top: "48%", left: "55%", level: "critical", label: "Darshan Queue" },
  { top: "68%", left: "38%", level: "medium", label: "Prasadam Hall" },
  { top: "35%", left: "72%", level: "low", label: "Parking B" },
  { top: "78%", left: "70%", level: "medium", label: "Exit Gate 3" },
];

const colorFor: Record<string, string> = {
  critical: "bg-destructive shadow-destructive",
  high: "bg-warning shadow-warning",
  medium: "bg-accent shadow-accent",
  low: "bg-success shadow-success",
};

export function TwinMap() {
  return (
    <div className="glass relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <p className="truncate text-sm font-semibold">Digital Twin Simulation Map</p>
          <span className="ml-2 hidden rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary sm:inline-block">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Layers className="h-4 w-4" />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 grid-bg">
        {/* faux paths */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M5,80 C25,60 30,30 55,45 S85,20 95,10"
            stroke="url(#pathGrad)"
            strokeWidth="0.6"
            fill="none"
            strokeDasharray="1.5 1"
          />
          <path
            d="M10,20 C35,25 55,70 80,60 S95,85 95,90"
            stroke="var(--color-accent)"
            strokeOpacity="0.5"
            strokeWidth="0.4"
            fill="none"
            strokeDasharray="1 1.5"
          />
        </svg>

        {hotspots.map((h, i) => (
          <motion.div
            key={h.label}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: h.top, left: h.left }}
          >
            <span
              className={`relative flex h-3 w-3 items-center justify-center rounded-full ${colorFor[h.level]} shadow-[0_0_16px]`}
            >
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colorFor[h.level]} opacity-60`} />
            </span>
            <div className="glass mt-2 -translate-x-1/2 rounded-md px-2 py-1 text-[10px] font-medium">
              <MapPin className="mr-1 inline h-2.5 w-2.5" />
              {h.label}
            </div>
          </motion.div>
        ))}

        <div className="glass absolute bottom-3 left-3 rounded-lg px-3 py-2 font-mono text-[10px] text-muted-foreground">
          17.4239° N · 79.3129° E
        </div>
        <div className="glass absolute bottom-3 right-3 flex items-center gap-3 rounded-lg px-3 py-2 text-[10px]">
          {(["low", "medium", "high", "critical"] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5 capitalize text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${colorFor[k]}`} />
              {k}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
