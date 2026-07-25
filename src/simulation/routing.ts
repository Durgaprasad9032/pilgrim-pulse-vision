import { LOCATIONS } from "./locations";
import { ROUTES, buildRoute } from "./routes";
import type {
  Agent,
  DevoteeType,
  LocationId,
  QueueState,
  RouteHealth,
  RouteHealthStatus,
  RouteId,
} from "./types";

const OPTIMIZABLE_ROUTES: RouteId[] = ["normal", "family", "senior", "disabled", "vip"];

const ENTRY_BY_ROUTE: Partial<Record<RouteId, LocationId[]>> = {
  normal: ["MainGate", "NorthGate", "SouthGate"],
  family: ["MainGate", "NorthGate", "SouthGate"],
  senior: ["ParkingEntry"],
  disabled: ["ParkingEntry"],
  vip: ["VIPEntry"],
};

export interface RouteEvaluationContext {
  agents: Agent[];
  counts: Record<LocationId, number>;
  queueState: QueueState;
  blockedEdges: Set<string>;
  closedGates: LocationId[];
  serviceRateMultiplier: number;
}

export interface RouteAssignment {
  routeId: RouteId;
  entryGate: LocationId;
  route: LocationId[];
}

function agentsOnRoute(agents: Agent[], routeId: RouteId): Agent[] {
  return agents.filter(
    (a) => a.routeId === routeId && a.status !== "Exited" && a.status !== "Pending",
  );
}

function routeCapacity(routeId: RouteId): number {
  const stops = ROUTES[routeId]?.stops ?? [];
  return stops.reduce((s, id) => s + (LOCATIONS[id]?.capacity ?? 0), 0);
}

function estimateTravelTime(
  routeId: RouteId,
  queueState: QueueState,
  loadFactor: number,
  serviceMult: number,
): number {
  const stops = ROUTES[routeId]?.stops ?? [];
  let seconds = 0;
  for (const stop of stops) {
    const loc = LOCATIONS[stop];
    if (!loc) continue;
    const wait = queueState.waitSeconds[stop] ?? 0;
    const serviceTime = 1 / Math.max(0.5, loc.serviceRate * serviceMult);
    seconds += wait * 0.3 + serviceTime * (1 + loadFactor * 0.5);
  }
  return Math.round(seconds + stops.length * 12);
}

function healthStatus(score: number, blocked: boolean): RouteHealthStatus {
  if (blocked) return "Blocked";
  if (score >= 75) return "Optimal";
  if (score >= 55) return "Moderate";
  if (score >= 35) return "Busy";
  return "Critical";
}

function isRouteBlocked(
  routeId: RouteId,
  entryGate: LocationId,
  blockedEdges: Set<string>,
  closedGates: LocationId[],
): boolean {
  if (closedGates.includes(entryGate)) return true;
  const route = buildRoute(routeId, entryGate, blockedEdges);
  for (let i = 0; i < route.length - 1; i++) {
    if (blockedEdges.has(`${route[i]}->${route[i + 1]}`)) return true;
  }
  return false;
}

export class RouteDecisionEngine {
  private lastEvalTick = 0;
  private evalInterval = 5;
  private routeHealth: RouteHealth[] = [];
  private recommendedRouteId: RouteId | null = null;

  reset(): void {
    this.lastEvalTick = 0;
    this.routeHealth = [];
    this.recommendedRouteId = null;
  }

  shouldEvaluate(tick: number): boolean {
    return tick - this.lastEvalTick >= this.evalInterval;
  }

  evaluate(tick: number, ctx: RouteEvaluationContext): RouteHealth[] {
    this.lastEvalTick = tick;
    const health: RouteHealth[] = [];

    for (const routeId of OPTIMIZABLE_ROUTES) {
      const def = ROUTES[routeId];
      if (!def) continue;

      const entryOptions = ENTRY_BY_ROUTE[routeId] ?? ["MainGate"];
      const openEntries = entryOptions.filter((g) => !ctx.closedGates.includes(g));
      if (openEntries.length === 0) {
        health.push({
          routeId,
          label: def.label,
          travelTimeSeconds: 9999,
          crowdDensity: 1,
          capacity: routeCapacity(routeId),
          loadPercent: 100,
          healthScore: 0,
          status: "Blocked",
          queueLength: 0,
          estimatedWaitSeconds: 9999,
        });
        continue;
      }

      const entryGate = openEntries[0];
      const blocked = isRouteBlocked(routeId, entryGate, ctx.blockedEdges, ctx.closedGates);
      const onRoute = agentsOnRoute(ctx.agents, routeId);
      const capacity = routeCapacity(routeId);
      const loadPercent = capacity > 0 ? (onRoute.length / capacity) * 100 : 0;

      let queueLength = 0;
      let waitSum = 0;
      for (const stop of def.stops) {
        queueLength += ctx.queueState.lengths[stop] ?? 0;
        waitSum += ctx.queueState.waitSeconds[stop] ?? 0;
      }

      const crowdDensity = def.stops.length
        ? def.stops.reduce((s, id) => s + (ctx.counts[id] ?? 0), 0) /
          def.stops.reduce((s, id) => s + LOCATIONS[id].capacity, 0)
        : 0;

      const travelTimeSeconds = estimateTravelTime(
        routeId,
        ctx.queueState,
        crowdDensity,
        ctx.serviceRateMultiplier,
      );

      let healthScore = 100;
      healthScore -= Math.min(40, loadPercent * 0.4);
      healthScore -= Math.min(25, queueLength * 0.5);
      healthScore -= Math.min(20, crowdDensity * 20);
      healthScore -= Math.min(15, travelTimeSeconds / 60);
      if (blocked) healthScore = 0;
      healthScore = Math.round(Math.max(0, Math.min(100, healthScore)));

      health.push({
        routeId,
        label: def.label,
        travelTimeSeconds,
        crowdDensity,
        capacity,
        loadPercent: Math.round(loadPercent),
        healthScore,
        status: blocked ? "Blocked" : healthStatus(healthScore, false),
        queueLength,
        estimatedWaitSeconds: Math.round(waitSum / Math.max(1, def.stops.length)),
      });
    }

    health.sort((a, b) => b.healthScore - a.healthScore);
    const best = health.find((h) => h.status !== "Blocked");
    if (best) {
      best.status = "Recommended";
      this.recommendedRouteId = best.routeId;
    }

    this.routeHealth = health;
    return health;
  }

  getRouteHealth(): RouteHealth[] {
    return this.routeHealth;
  }

  getRecommendedRouteId(): RouteId | null {
    return this.recommendedRouteId;
  }

  /** Pick optimal route + entry for a new devotee */
  assignRoute(
    devoteeType: DevoteeType,
    preferredRouteId: RouteId,
    preferredEntry: LocationId,
    ctx: RouteEvaluationContext,
  ): RouteAssignment {
    const candidates = this.getCandidatesForType(devoteeType, preferredRouteId, ctx.closedGates);
    let best: RouteAssignment | null = null;
    let bestScore = -1;

    for (const { routeId, entryGate } of candidates) {
      if (isRouteBlocked(routeId, entryGate, ctx.blockedEdges, ctx.closedGates)) continue;
      const health = this.routeHealth.find((h) => h.routeId === routeId);
      const score = health?.healthScore ?? 50;
      const entryBonus = entryGate === preferredEntry ? 5 : 0;
      const total = score + entryBonus;
      if (total > bestScore) {
        bestScore = total;
        best = {
          routeId,
          entryGate,
          route: buildRoute(routeId, entryGate, ctx.blockedEdges),
        };
      }
    }

    if (!best) {
      return {
        routeId: preferredRouteId,
        entryGate: preferredEntry,
        route: buildRoute(preferredRouteId, preferredEntry, ctx.blockedEdges),
      };
    }
    return best;
  }

  private getCandidatesForType(
    type: DevoteeType,
    preferredRouteId: RouteId,
    closedGates: LocationId[],
  ): { routeId: RouteId; entryGate: LocationId }[] {
    if (type === "VIP") {
      return [{ routeId: "vip", entryGate: "VIPEntry" }];
    }
    if (type === "Senior Citizen") {
      return [{ routeId: "senior", entryGate: "ParkingEntry" }];
    }
    if (type === "Disabled") {
      return [{ routeId: "disabled", entryGate: "ParkingEntry" }];
    }
    if (type === "Family") {
      return (["MainGate", "NorthGate", "SouthGate"] as LocationId[])
        .filter((g) => !closedGates.includes(g))
        .map((entryGate) => ({ routeId: "family" as RouteId, entryGate }));
    }

    const entries = (["MainGate", "NorthGate", "SouthGate"] as LocationId[]).filter(
      (g) => !closedGates.includes(g),
    );
    const routes: RouteId[] =
      preferredRouteId === "family" ? ["normal", "family"] : ["normal", "family"];
    const out: { routeId: RouteId; entryGate: LocationId }[] = [];
    for (const routeId of routes) {
      for (const entryGate of entries) {
        out.push({ routeId, entryGate });
      }
    }
    return out;
  }
}

export const routeDecisionEngine = new RouteDecisionEngine();
