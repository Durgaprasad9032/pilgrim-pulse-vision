import { useEffect, useRef } from "react";
import { Layers, Maximize2, MapPin, Radio } from "lucide-react";
import { engine, useSimulation } from "@/simulation/hooks";
import { LOCATIONS, LOCATION_ORDER } from "@/simulation/engine";
import type { LocationStat } from "@/simulation/types";

const levelColor: Record<LocationStat["level"], string> = {
  critical: "bg-destructive shadow-destructive",
  high: "bg-warning shadow-warning",
  medium: "bg-accent shadow-accent",
  low: "bg-success shadow-success",
};

const levelStroke: Record<LocationStat["level"], string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#22d3ee",
  low: "#22c55e",
};

function useCanvasRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);

      // draw path lines between locations
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < LOCATION_ORDER.length - 1; i++) {
        const a = LOCATIONS[LOCATION_ORDER[i]].pos;
        const b = LOCATIONS[LOCATION_ORDER[i + 1]].pos;
        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // agents
      const agents = engine.agents;
      ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        if (a.status === "Exited") continue;
        const x = a.pos.x * W;
        const y = a.pos.y * H;
        ctx.fillRect(x, y, 1.6, 1.6);
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [canvasRef]);
}

export function TwinMap() {
  const sim = useSimulation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvasRenderer(canvasRef);

  return (
    <div className="glass relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <p className="truncate text-sm font-semibold">Digital Twin Simulation Map</p>
          <span className="ml-2 hidden rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary sm:inline-block">
            {sim.status === "running" ? "LIVE" : sim.status.toUpperCase()}
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
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {sim.locations.map((loc) => {
          const pos = LOCATIONS[loc.id].pos;
          return (
            <div
              key={loc.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${pos.y * 100}%`, left: `${pos.x * 100}%` }}
            >
              <span
                className={`relative flex h-3 w-3 items-center justify-center rounded-full ${levelColor[loc.level]} shadow-[0_0_16px]`}
                style={{ boxShadow: `0 0 ${8 + loc.load * 24}px ${levelStroke[loc.level]}` }}
              >
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full ${levelColor[loc.level]} opacity-60`}
                />
              </span>
              <div className="glass mt-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium">
                <MapPin className="mr-1 inline h-2.5 w-2.5" />
                {loc.label} · {loc.count.toLocaleString()}
              </div>
            </div>
          );
        })}

        <div className="glass absolute bottom-3 left-3 rounded-lg px-3 py-2 font-mono text-[10px] text-muted-foreground">
          17.4239° N · 79.3129° E
        </div>
        <div className="glass absolute bottom-3 right-3 flex items-center gap-3 rounded-lg px-3 py-2 text-[10px]">
          {(["low", "medium", "high", "critical"] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5 capitalize text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${levelColor[k]}`} />
              {k}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
