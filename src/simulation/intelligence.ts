import { generateSmartAlerts, resetAlertCounter } from "./alerts";
import { computeLiveAnalytics, LiveAnalyticsTracker } from "./analytics";
import { generateRecommendations } from "./decisionEngine";
import type { EventEffects } from "./events";
import { crowdPredictor } from "./prediction";
import { routeDecisionEngine, type RouteEvaluationContext } from "./routing";
import type {
  Agent,
  IntelligenceSnapshot,
  LocationId,
  LocationStat,
  QueueState,
  RouteId,
  ScenarioId,
  SimEvent,
  SystemStatus,
} from "./types";

export interface IntelligenceContext {
  tick: number;
  scenario: ScenarioId;
  agents: Agent[];
  counts: Record<LocationId, number>;
  queueState: QueueState;
  locations: LocationStat[];
  congestionIndex: number;
  waitingSeconds: number;
  activeEvents: SimEvent[];
  eventEffects: EventEffects;
  blockedEdges: Set<string>;
  exitedAgents: number;
  reroutedCount: number;
  arrivalRate: number;
  exitRate: number;
  emergencyRouteActive: boolean;
}

function systemStatus(
  congestionIndex: number,
  alerts: { severity: string }[],
): SystemStatus {
  if (alerts.some((a) => a.severity === "Critical") || congestionIndex > 85) return "Critical";
  if (congestionIndex > 55 || alerts.some((a) => a.severity === "Warning")) return "Elevated";
  return "Normal";
}

export function buildIntelligenceSnapshot(ctx: IntelligenceContext): IntelligenceSnapshot {
  const queueTotal = Object.values(ctx.queueState.lengths).reduce((s, v) => s + v, 0);

  crowdPredictor.updateHistory({
    tick: ctx.tick,
    crowd: ctx.agents.filter((a) => a.status !== "Exited" && a.status !== "Pending").length,
    congestion: ctx.congestionIndex,
    queueTotal,
  });

  const congestionTrend = crowdPredictor.computeCongestionTrend();
  const queueGrowth = crowdPredictor.computeQueueGrowth(queueTotal);

  const predictionResult = crowdPredictor.predict({
    tick: ctx.tick,
    currentCrowd: ctx.agents.filter((a) => a.status !== "Exited" && a.status !== "Pending").length,
    arrivalRate: ctx.arrivalRate,
    exitRate: ctx.exitRate,
    queueGrowth,
    congestionIndex: ctx.congestionIndex,
    congestionTrend,
    queueState: ctx.queueState,
    historyLength: ctx.tick,
  });

  const routeCtx: RouteEvaluationContext = {
    agents: ctx.agents,
    counts: ctx.counts,
    queueState: ctx.queueState,
    blockedEdges: ctx.blockedEdges,
    closedGates: ctx.eventEffects.closedGates,
    serviceRateMultiplier: ctx.eventEffects.serviceRateMultiplier,
  };

  if (routeDecisionEngine.shouldEvaluate(ctx.tick) || ctx.tick === 0) {
    routeDecisionEngine.evaluate(ctx.tick, routeCtx);
  }

  const routeHealth = routeDecisionEngine.getRouteHealth();
  const recommendedRouteId = routeDecisionEngine.getRecommendedRouteId();

  const recommendations = generateRecommendations({
    tick: ctx.tick,
    locations: ctx.locations,
    routeHealth,
    recommendedRouteId,
    waitingSeconds: ctx.waitingSeconds,
    congestionIndex: ctx.congestionIndex,
    activeEvents: ctx.activeEvents,
    closedGates: ctx.eventEffects.closedGates,
    arrivalRate: ctx.arrivalRate,
    queueGrowth,
  });

  const alerts = generateSmartAlerts({
    tick: ctx.tick,
    locations: ctx.locations,
    routeHealth,
    waitingSeconds: ctx.waitingSeconds,
    activeEvents: ctx.activeEvents,
    emergencyRouteActive: ctx.emergencyRouteActive,
    reroutedCount: ctx.reroutedCount,
  });

  const analytics = computeLiveAnalytics(ctx.agents, ctx.tick, ctx.reroutedCount);

  const bestRoute = routeHealth.find((r) => r.status === "Recommended") ?? routeHealth[0] ?? null;
  const worstRoute =
    [...routeHealth].sort((a, b) => a.healthScore - b.healthScore).find((r) => r.healthScore < 100) ??
    null;
  const mostCrowdedLocation =
    [...ctx.locations].sort((a, b) => b.load - a.load).find((l) => l.load > 0) ?? null;

  const recommendedRouteLabel = bestRoute?.label ?? "Normal Route";

  return {
    metrics: predictionResult.metrics,
    predictions: predictionResult.predictions,
    overallConfidence: predictionResult.overallConfidence,
    routeHealth,
    recommendedRouteId,
    alerts,
    recommendations,
    analytics,
    commandCenter: {
      alerts,
      bestRoute,
      worstRoute,
      mostCrowdedLocation,
      predictions: predictionResult.predictions,
      suggestedActions: recommendations,
      systemStatus: systemStatus(ctx.congestionIndex, alerts),
      activeIncidents: ctx.activeEvents.filter((e) => e.active).map((e) => e.type),
      recommendedRouteLabel,
    },
  };
}

export function resetIntelligence(): void {
  crowdPredictor.reset();
  routeDecisionEngine.reset();
  resetAlertCounter();
  LiveAnalyticsTracker.reset();
}

export { routeDecisionEngine, crowdPredictor, LiveAnalyticsTracker };
