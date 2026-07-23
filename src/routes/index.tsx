import { createFileRoute } from "@tanstack/react-router";
import { Activity, Brain, Clock, Gauge, Users } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TwinMap } from "@/components/dashboard/TwinMap";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { ChartsRow } from "@/components/dashboard/Charts";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { StatusBar } from "@/components/dashboard/StatusBar";
import { Footer } from "@/components/dashboard/Footer";
import { useSimulation } from "@/simulation/hooks";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Operations Dashboard · Yatra AI" },
      {
        name: "description",
        content:
          "Live digital-twin control room for pilgrimage crowd flow — predictions, congestion alerts, and dynamic route optimization.",
      },
      { property: "og:title", content: "Operations Dashboard · Yatra AI" },
      {
        property: "og:description",
        content: "Live digital-twin control room for pilgrimage crowd flow.",
      },
    ],
  }),
});

function formatWait(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function Dashboard() {
  const sim = useSimulation();
  const predicted = Math.round(sim.activeAgents * 1.17);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 space-y-5 p-4 sm:p-6">
          {/* KPI row */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              index={0}
              icon={Users}
              accent="primary"
              label="Current Crowd"
              value={sim.activeAgents.toLocaleString()}
              subtitle="Across all zones"
              trend={4.2}
            />
            <KpiCard
              index={1}
              icon={Brain}
              accent="accent"
              label="Current Prediction"
              value={predicted.toLocaleString()}
              subtitle="Next 30 minutes"
              trend={17.6}
            />
            <KpiCard
              index={2}
              icon={Gauge}
              accent={sim.congestionIndex > 75 ? "destructive" : "warning"}
              label="Congestion Level"
              value={sim.congestionLabel}
              subtitle={`${sim.congestionIndex} / 100 index`}
              trend={-3.1}
            />
            <KpiCard
              index={3}
              icon={Clock}
              accent="success"
              label="Avg Waiting Time"
              value={formatWait(sim.waitingSeconds)}
              subtitle="Darshan queue"
              trend={-8.4}
            />
            <KpiCard
              index={4}
              icon={Activity}
              accent="destructive"
              label="Active Simulation"
              value={sim.scenario}
              subtitle={`Twin ID · TW-3021 · t+${sim.tick}s`}
              trend={0}
            />
          </section>

          {/* Control */}
          <ControlPanel />

          {/* Map + alerts */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <TwinMap />
            <AlertsPanel />
          </section>

          {/* Charts */}
          <ChartsRow />

          {/* Status */}
          <StatusBar />

          <Footer />
        </main>
      </div>
    </div>
  );
}
