import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  Brain,
  BarChart3,
  FileText,
  Settings,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Simulation", icon: Activity },
  { label: "Predictions", icon: Brain },
  { label: "Analytics", icon: BarChart3 },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="glass hidden h-screen w-64 shrink-0 flex-col rounded-none border-l-0 border-t-0 border-b-0 lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
          <Waypoints className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">Yatra AI</p>
          <p className="truncate text-xs text-muted-foreground">Crowd Management</p>
        </div>
      </div>

      <div className="mt-2 px-3">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Navigation
        </p>
        <nav className="flex flex-col gap-1">
          {nav.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                item.active
                  ? "bg-sidebar-accent text-foreground shadow-inner"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  item.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px] shadow-primary" />
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-muted-foreground">Twin Engine Online</span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">v1.4.2 · edge cluster</p>
        </div>
      </div>
    </aside>
  );
}
