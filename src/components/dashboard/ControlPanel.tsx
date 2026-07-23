import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const scenarios = ["Normal Day", "Weekend", "Festival", "Emergency"] as const;

export function ControlPanel() {
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>("Weekend");
  const [running, setRunning] = useState(true);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight">Simulation Control</h3>
            <p className="truncate text-[11px] text-muted-foreground">
              Digital twin engine · scenario runtime
            </p>
          </div>
        </div>
        <span
          className={cn(
            "hidden rounded-full px-2.5 py-1 text-[10px] font-medium sm:inline-flex",
            running ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {running ? "● RUNNING" : "◐ IDLE"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Scenario
          </label>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.96 }}
                onClick={() => setScenario(s)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  scenario === s
                    ? "border-primary/50 bg-primary/15 text-primary shadow-[0_0_20px_-6px] shadow-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setRunning(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Play className="h-3.5 w-3.5" /> Start
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setRunning(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <Pause className="h-3.5 w-3.5" /> Pause
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </motion.button>
        </div>
      </div>
    </div>
  );
}
