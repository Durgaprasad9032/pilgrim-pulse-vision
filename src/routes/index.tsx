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

function Dashboard() {
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
              value="42,180"
              subtitle="Across all zones"
              trend={4.2}
            />
            <KpiCard
              index={1}
              icon={Brain}
              accent="accent"
              label="Current Prediction"
              value="49,600"
              subtitle="Next 30 minutes"
              trend={17.6}
            />
            <KpiCard
              index={2}
              icon={Gauge}
              accent="warning"
              label="Congestion Level"
              value="High"
              subtitle="72 / 100 index"
              trend={-3.1}
            />
            <KpiCard
              index={3}
              icon={Clock}
              accent="success"
              label="Avg Waiting Time"
              value="14m 22s"
              subtitle="Darshan queue"
              trend={-8.4}
            />
            <KpiCard
              index={4}
              icon={Activity}
              accent="destructive"
              label="Active Simulation"
              value="Weekend"
              subtitle="Twin ID · TW-3021"
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
