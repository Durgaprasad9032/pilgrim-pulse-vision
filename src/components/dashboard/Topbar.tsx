import { Bell, Calendar, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export function Topbar() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="glass sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-none border-x-0 border-t-0 px-4 py-3 sm:flex sm:flex-wrap sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden h-9 w-1 rounded-full bg-gradient-to-b from-primary to-accent sm:block" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Digital Twin · Predictive Crowd &amp; Route Optimization
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Pilgrimage Center — Tirumala Sector 4 · Live Twin
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs text-muted-foreground">Simulation:</span>
          <span className="text-xs font-medium text-success">Running</span>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground lg:flex">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-mono">{now}</span>
        </div>

        <button className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-secondary/70">
          <Bell className="h-4 w-4" />
          <span className="absolute mt-[-18px] ml-[18px] h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 py-1 pl-1 pr-3">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-accent">
            <ShieldCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden text-xs leading-tight sm:block">
            <p className="font-medium">Control Admin</p>
            <p className="text-[10px] text-muted-foreground">Ops Center</p>
          </div>
        </div>
      </div>
    </header>
  );
}
