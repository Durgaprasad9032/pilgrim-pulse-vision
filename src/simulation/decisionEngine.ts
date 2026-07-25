import type {
  DecisionRecommendation,
  LocationStat,
  RouteHealth,
  RouteId,
  SimEvent,
} from "./types";

export interface DecisionContext {
  tick: number;
  locations: LocationStat[];
  routeHealth: RouteHealth[];
  recommendedRouteId: RouteId | null;
  waitingSeconds: number;
  congestionIndex: number;
  activeEvents: SimEvent[];
  closedGates: string[];
  arrivalRate: number;
  queueGrowth: number;
}

const ACTION_CATALOG: {
  id: string;
  action: string;
  condition: (ctx: DecisionContext) => string | null;
  priority: DecisionRecommendation["priority"];
}[] = [
  {
    id: "open-north-gate",
    action: "Open North Gate",
    priority: "Medium",
    condition: (ctx) => {
      const main = ctx.locations.find((l) => l.id === "MainGate");
      const north = ctx.locations.find((l) => l.id === "NorthGate");
      if (main && main.load > 0.8 && north && north.load < 0.5) {
        return `Main Gate at ${Math.round(main.load * 100)}% — North Gate has spare capacity`;
      }
      return null;
    },
  },
  {
    id: "close-south-gate",
    action: "Close South Gate",
    priority: "High",
    condition: (ctx) => {
      const south = ctx.locations.find((l) => l.id === "SouthGate");
      const queue = ctx.locations.find((l) => l.id === "DarshanQueue");
      if (south && south.load > 0.85 && queue && queue.load > 0.9) {
        return "Downstream congestion — reduce South Gate inflow";
      }
      return null;
    },
  },
  {
    id: "redirect-vip",
    action: "Redirect to VIP Route",
    priority: "Low",
    condition: (ctx) => {
      const vip = ctx.routeHealth.find((r) => r.routeId === "vip");
      const normal = ctx.routeHealth.find((r) => r.routeId === "normal");
      if (vip && normal && vip.healthScore > normal.healthScore + 20 && vip.status !== "Blocked") {
        return "VIP corridor underutilized — offer express routing";
      }
      return null;
    },
  },
  {
    id: "increase-security",
    action: "Increase Security Capacity",
    priority: "Medium",
    condition: (ctx) => {
      const sec = ctx.locations.find((l) => l.id === "SecurityCheck");
      if (sec && sec.load > 0.75) {
        return `Security Check backlog — ${sec.count} agents queued`;
      }
      return null;
    },
  },
  {
    id: "open-waiting-hall",
    action: "Open Temporary Waiting Hall",
    priority: "High",
    condition: (ctx) => {
      const hall = ctx.locations.find((l) => l.id === "WaitingHall");
      const queue = ctx.locations.find((l) => l.id === "DarshanQueue");
      if (hall && hall.load > 0.85 && queue && queue.load > 0.8) {
        return "Pre-queue overflow — deploy auxiliary holding area";
      }
      return null;
    },
  },
  {
    id: "reduce-arrivals",
    action: "Reduce Arrivals",
    priority: "High",
    condition: (ctx) => {
      if (ctx.congestionIndex > 85 && ctx.queueGrowth > 5) {
        return `Congestion ${ctx.congestionIndex}/100 with rising queues (+${ctx.queueGrowth}/s)`;
      }
      return null;
    },
  },
  {
    id: "medical-team",
    action: "Medical Team Required",
    priority: "High",
    condition: (ctx) => {
      const med = ctx.locations.find((l) => l.id === "MedicalCenter");
      const hasMedicalEvent = ctx.activeEvents.some((e) => e.type === "Medical Emergency");
      if (hasMedicalEvent || (med && med.load > 0.8)) {
        return hasMedicalEvent
          ? "Active medical emergency incident"
          : `Medical Center at ${Math.round((med?.load ?? 0) * 100)}% capacity`;
      }
      return null;
    },
  },
  {
    id: "deploy-volunteers",
    action: "Deploy Volunteers",
    priority: "Medium",
    condition: (ctx) => {
      const temple = ctx.locations.find((l) => l.id === "Temple");
      if (temple && temple.load > 0.7 && ctx.arrivalRate > 10) {
        return "High temple throughput — add crowd marshals";
      }
      return null;
    },
  },
];

export function generateRecommendations(ctx: DecisionContext): DecisionRecommendation[] {
  const recs: DecisionRecommendation[] = [];

  for (const item of ACTION_CATALOG) {
    const reason = item.condition(ctx);
    if (reason) {
      recs.push({
        id: item.id,
        action: item.action,
        reason,
        priority: item.priority,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      id: "maintain",
      action: "Maintain Current Operations",
      reason: "All zones within acceptable thresholds",
      priority: "Low",
    });
  }

  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6);
}
