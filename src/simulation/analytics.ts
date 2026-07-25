import { LOCATION_ORDER, LOCATIONS } from "./locations";
import type {
  Agent,
  IntelligenceSnapshot,
  LocationId,
  LocationStat,
  RouteId,
  SimSnapshot,
  SimStatus,
} from "./types";
import type { QueueState } from "./types";
export function loadToLevel(load: number): LocationStat["level"] {
  if (load > 1) return "critical";
  if (load > 0.75) return "high";
  if (load > 0.45) return "medium";
  return "low";
}

/** Heat level aligned to crowd density: green → yellow → orange → red */
export function densityHeatLevel(density: number): LocationStat["level"] {
  if (density > 0.85) return "critical";
  if (density > 0.65) return "high";
  if (density > 0.35) return "medium";
  return "low";
}

export function computeLocationStats(
  counts: Record<LocationId, number>,
  queueState: QueueState,
): LocationStat[] {
  return LOCATION_ORDER.map((id) => {
    const loc = LOCATIONS[id];
    const c = counts[id];
    const queued = queueState.lengths[id] ?? 0;
    const effectiveCount = c + queued * 0.5;
    const load = effectiveCount / loc.capacity;
    const density = c / loc.capacity;
    const level = densityHeatLevel(Math.max(load, density));
    return { id, label: loc.label, count: c, capacity: loc.capacity, load, level };
  });
}

export function computeCongestion(locations: LocationStat[]): {
  congestionIndex: number;
  congestionLabel: SimSnapshot["congestionLabel"];
} {
  const totalLoad =
    locations.reduce((s, l) => s + Math.min(1.5, l.load), 0) / locations.length;
  const congestionIndex = Math.round(Math.min(100, totalLoad * 80));
  const congestionLabel: SimSnapshot["congestionLabel"] =
    congestionIndex > 80
      ? "Critical"
      : congestionIndex > 60
        ? "High"
        : congestionIndex > 35
          ? "Moderate"
          : "Low";
  return { congestionIndex, congestionLabel };
}

export function computeWaitingSeconds(queueState: QueueState): number {
  const darshanWait = queueState.waitSeconds.DarshanQueue ?? 0;
  const waitingHallWait = queueState.waitSeconds.WaitingHall ?? 0;
  return Math.round(Math.max(darshanWait, waitingHallWait * 0.6 + darshanWait * 0.4));
}

export function updateTrend(
  trend: { t: number; crowd: number; predicted: number }[],
  tick: number,
  active: number,
): { t: number; crowd: number; predicted: number }[] {
  const next = [
    ...trend,
    {
      t: tick,
      crowd: active,
      predicted: Math.round(active * (1 + Math.sin(tick / 20) * 0.08 + 0.05)),
    },
  ];
  if (next.length > 60) next.shift();
  return next;
}

export function buildSnapshot(
  status: SimStatus,
  scenario: SimSnapshot["scenario"],
  tick: number,
  totalAgents: number,
  activeAgents: number,
  exitedAgents: number,
  locations: LocationStat[],
  waitingSeconds: number,
  trend: { t: number; crowd: number; predicted: number }[],
  intelligence: IntelligenceSnapshot,
): SimSnapshot {
  const { congestionIndex, congestionLabel } = computeCongestion(locations);
  return {
    status,
    scenario,
    tick,
    totalAgents,
    activeAgents,
    exitedAgents,
    congestionIndex,
    congestionLabel,
    waitingSeconds,
    locations,
    trend,
    intelligence,
  };
}

export function buildIdleIntelligence(): IntelligenceSnapshot {
  return {
    metrics: {
      currentCrowd: 0,
      arrivalRate: 0,
      exitRate: 0,
      queueGrowth: 0,
      congestionTrend: 0,
    },
    predictions: [
      { horizonMinutes: 5, expectedCrowd: 0, expectedCongestion: 0, confidence: "Low" },
      { horizonMinutes: 10, expectedCrowd: 0, expectedCongestion: 0, confidence: "Low" },
      { horizonMinutes: 30, expectedCrowd: 0, expectedCongestion: 0, confidence: "Low" },
    ],
    overallConfidence: "Low",
    routeHealth: [],
    recommendedRouteId: null,
    alerts: [],
    recommendations: [],
    analytics: {
      avgTravelTimeSeconds: 0,
      queueThroughput: 0,
      peopleServedPerMinute: 0,
      avgWaitingTimeSeconds: 0,
      mostUsedRoute: "normal",
      leastUsedRoute: "normal",
      routeUtilization: {},
      reroutedDevotees: 0,
    },
    commandCenter: {
      alerts: [],
      bestRoute: null,
      worstRoute: null,
      mostCrowdedLocation: null,
      predictions: [],
      suggestedActions: [],
      systemStatus: "Normal",
      activeIncidents: [],
      recommendedRouteLabel: "Normal Route",
    },
  };
}

export function buildIdleSnapshot(scenario: SimSnapshot["scenario"]): SimSnapshot {
  const locations = LOCATION_ORDER.map((id) => ({
    id,
    label: LOCATIONS[id].label,
    count: 0,
    capacity: LOCATIONS[id].capacity,
    load: 0,
    level: "low" as const,
  }));
  return buildSnapshot("idle", scenario, 0, 0, 0, 0, locations, 0, [], buildIdleIntelligence());
}

/** Grid-based crowd density for heatmap rendering (0..1 per cell) */
export function computeDensityGrid(
  agents: { pos: { x: number; y: number }; status: string }[],
  gridW = 32,
  gridH = 24,
): Float32Array {
  const grid = new Float32Array(gridW * gridH);
  for (const a of agents) {
    if (a.status === "Exited" || a.status === "Pending") continue;
    const gx = Math.min(gridW - 1, Math.max(0, Math.floor(a.pos.x * gridW)));
    const gy = Math.min(gridH - 1, Math.max(0, Math.floor(a.pos.y * gridH)));
    grid[gy * gridW + gx] += 1;
  }

  let max = 1;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > max) max = grid[i];
  }

  for (let i = 0; i < grid.length; i++) {
    grid[i] = grid[i] / max;
  }
  return grid;
}

export function heatColor(density: number): string {
  if (density > 0.85) return "rgba(239, 68, 68, 0.55)";
  if (density > 0.65) return "rgba(249, 115, 22, 0.45)";
  if (density > 0.35) return "rgba(234, 179, 8, 0.35)";
  return "rgba(34, 197, 94, 0.2)";
}

/** Tracks live analytics across simulation ticks */
export class LiveAnalyticsTracker {
  private static prevExited = 0;
  private static prevTick = 0;
  private static travelSamples: number[] = [];

  static reset(): void {
    LiveAnalyticsTracker.prevExited = 0;
    LiveAnalyticsTracker.prevTick = 0;
    LiveAnalyticsTracker.travelSamples = [];
  }

  static recordTravel(seconds: number): void {
    LiveAnalyticsTracker.travelSamples.push(seconds);
    if (LiveAnalyticsTracker.travelSamples.length > 100) {
      LiveAnalyticsTracker.travelSamples.shift();
    }
  }

  static peopleServedPerMinute(exited: number, tick: number): number {
    const dt = Math.max(1, tick - LiveAnalyticsTracker.prevTick);
    const delta = exited - LiveAnalyticsTracker.prevExited;
    LiveAnalyticsTracker.prevExited = exited;
    LiveAnalyticsTracker.prevTick = tick;
    return Math.round((delta / dt) * 60 * 10) / 10;
  }
}

export function computeLiveAnalytics(
  agents: Agent[],
  tick: number,
  reroutedDevotees: number,
): IntelligenceSnapshot["analytics"] {
  const active = agents.filter((a) => a.status !== "Exited" && a.status !== "Pending");
  const routeCounts: Partial<Record<RouteId, number>> = {};
  let waitSum = 0;
  let waitCount = 0;

  for (const a of active) {
    routeCounts[a.routeId] = (routeCounts[a.routeId] ?? 0) + 1;
    if (a.status === "Queued") {
      waitSum += a.queueWaitRemaining;
      waitCount += 1;
    }
  }

  const routes = Object.entries(routeCounts) as [RouteId, number][];
  routes.sort((a, b) => b[1] - a[1]);
  const mostUsedRoute = routes[0]?.[0] ?? "normal";
  const leastUsedRoute = routes[routes.length - 1]?.[0] ?? "normal";

  const total = active.length || 1;
  const routeUtilization: Partial<Record<RouteId, number>> = {};
  for (const [id, count] of routes) {
    routeUtilization[id] = Math.round((count / total) * 100);
  }

  const avgTravelTimeSeconds =
    LiveAnalyticsTracker.travelSamples.length > 0
      ? Math.round(
          LiveAnalyticsTracker.travelSamples.reduce((s, v) => s + v, 0) /
            LiveAnalyticsTracker.travelSamples.length,
        )
      : Math.round(tick * 0.8);

  const exited = agents.filter((a) => a.status === "Exited").length;
  const servedPerMin = LiveAnalyticsTracker.peopleServedPerMinute(exited, tick);
  const queued = agents.filter((a) => a.status === "Queued").length;

  return {
    avgTravelTimeSeconds,
    queueThroughput: Math.round((queued / Math.max(1, total)) * 100),
    peopleServedPerMinute: servedPerMin,
    avgWaitingTimeSeconds: waitCount > 0 ? Math.round(waitSum / waitCount) : 0,
    mostUsedRoute,
    leastUsedRoute,
    routeUtilization,
    reroutedDevotees,
  };
}
