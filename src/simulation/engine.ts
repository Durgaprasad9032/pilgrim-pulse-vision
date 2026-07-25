import { createAgents, getDevoteeProfile } from "./agents";
import {
  buildQueueState,
  computeQueueWait,
  countQueuedAgents,
  initQueueMetrics,
  shouldEnterQueue,
  updateArrivalRates,
} from "./queue";
import { nextStop, routeProgress, rerouteBlocked } from "./routes";
import {
  buildIdleSnapshot,
  buildSnapshot,
  computeCongestion,
  computeLocationStats,
  computeWaitingSeconds,
  LiveAnalyticsTracker,
  updateTrend,
} from "./analytics";
import { edgesToSet, EventManager } from "./events";
import { buildIntelligenceSnapshot, resetIntelligence, routeDecisionEngine } from "./intelligence";
import { emptyLocationCounts, jitter, LOCATIONS } from "./locations";
import { getScenario, SCENARIOS } from "./scenarios";
import type {
  Agent,
  LocationId,
  ScenarioId,
  SimSnapshot,
  SimStatus,
} from "./types";

export { LOCATIONS, LOCATION_ORDER, MAP_ROUTE_EDGES } from "./locations";
export { SCENARIOS } from "./scenarios";
export { dist } from "./locations";

class SimulationEngine {
  agents: Agent[] = [];
  status: SimStatus = "idle";
  scenario: ScenarioId = "Weekend";
  tick = 0;
  exited = 0;
  private lastFrame = 0;
  private rafId: number | null = null;
  private snapshot: SimSnapshot = buildIdleSnapshot(this.scenario);
  private listeners = new Set<() => void>();
  private trend: { t: number; crowd: number; predicted: number }[] = [];
  private snapshotTimer = 0;
  private events = new EventManager();
  private queueMetrics = initQueueMetrics();
  private blockedEdges = new Set<string>();
  private reroutedCount = 0;
  private prevExited = 0;
  private arrivalRateEstimate = 0;
  private exitRateEstimate = 0;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = (): SimSnapshot => this.snapshot;

  setScenario(id: ScenarioId) {
    this.scenario = id;
    this.reset();
  }

  start() {
    if (this.status === "running") return;
    if (this.agents.length === 0) this.spawn();
    this.status = "running";
    this.lastFrame = performance.now();
    this.loop();
    this.refresh();
  }

  pause() {
    if (this.status !== "running") return;
    this.status = "paused";
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.refresh();
  }

  resume() {
    if (this.status !== "paused") return;
    this.status = "running";
    this.lastFrame = performance.now();
    this.loop();
    this.refresh();
  }

  reset() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.status = "idle";
    this.tick = 0;
    this.exited = 0;
    this.snapshotTimer = 0;
    this.trend = [];
    this.queueMetrics = initQueueMetrics();
    this.reroutedCount = 0;
    this.prevExited = 0;
    this.arrivalRateEstimate = 0;
    this.exitRateEstimate = 0;
    resetIntelligence();
    this.events.resetForScenario(this.scenario);
    this.refreshBlockedEdges();
    this.spawn();
    this.refresh();
  }

  private refreshBlockedEdges() {
    const scenario = getScenario(this.scenario);
    const eventEffects = this.events.getEffects();
    const allEdges = [
      ...(scenario.blockedEdges ?? []),
      ...eventEffects.blockedEdges,
    ] as [LocationId, LocationId][];
    this.blockedEdges = edgesToSet(allEdges);
  }

  private spawn() {
    this.refreshBlockedEdges();
    this.agents = createAgents(getScenario(this.scenario), this.blockedEdges);
  }

  private isEmergencyMode(): boolean {
    return (
      this.scenario === "Emergency" &&
      this.events.getActiveEvents().some((e) => e.type === "Medical Emergency" || e.type === "Fire")
    );
  }

  private applyRouteOptimization(agent: Agent) {
    const eventEffects = this.events.getEffects();
    const assignment = routeDecisionEngine.assignRoute(
      agent.devoteeType,
      agent.routeId,
      agent.entryGate,
      {
        agents: this.agents,
        counts: emptyLocationCounts(),
        queueState: buildQueueState(this.queueMetrics),
        blockedEdges: this.blockedEdges,
        closedGates: eventEffects.closedGates,
        serviceRateMultiplier: eventEffects.serviceRateMultiplier,
      },
    );

    if (assignment.routeId !== agent.routeId || assignment.entryGate !== agent.entryGate) {
      agent.routeId = assignment.routeId;
      agent.entryGate = assignment.entryGate;
      agent.route = assignment.route;
      agent.wasRerouted = true;
      this.reroutedCount += 1;
      agent.pos = jitter(LOCATIONS[assignment.entryGate].pos, 0.04);
    }

    const firstStop = agent.route[1] ?? agent.route[0];
    agent.destination = firstStop;
    agent.target = jitter(LOCATIONS[firstStop].pos, 0.03);
    agent.routeIndex = 0;
  }

  private loop = () => {
    if (this.status !== "running") return;
    const now = performance.now();
    let dt = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    if (dt > 0.25) dt = 0.25;
    this.step(dt);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private step(dt: number) {
    this.events.tick(this.tick);
    this.refreshBlockedEdges();

    const scenario = getScenario(this.scenario);
    const eventEffects = this.events.getEffects();
    const serviceMult = eventEffects.serviceRateMultiplier;
    const counts = emptyLocationCounts();
    const arrivalsThisStep = emptyLocationCounts();
    const emergencyMode = this.isEmergencyMode();

    const agents = this.agents;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (a.status === "Exited") continue;

      if (a.status === "Pending") {
        if (this.tick < a.spawnAt) continue;
        this.applyRouteOptimization(a);
        a.status = "Walking";
        arrivalsThisStep[a.entryGate] += 1;
        continue;
      }

      if (emergencyMode && a.status === "Walking" && Math.random() < 0.002) {
        a.route = rerouteBlocked(a.route, this.blockedEdges);
        a.wasRerouted = true;
        this.reroutedCount += 1;
      }

      if (a.status === "Queued") {
        a.queueWaitRemaining -= dt;
        counts[a.destination] += 1;
        if (a.queueWaitRemaining <= 0) {
          a.status = "Walking";
          const { next, rerouted, routeIndex } = nextStop(
            a.route,
            a.destination,
            this.blockedEdges,
          );
          a.route = rerouted;
          a.routeIndex = routeIndex;
          if (!next) {
            a.status = "Exited";
            this.exited += 1;
            LiveAnalyticsTracker.recordTravel(this.tick - a.spawnAt);
            continue;
          }
          a.destination = next;
          a.target = jitter(LOCATIONS[next].pos, 0.035);
          a.progress = routeProgress(a.routeIndex, a.route.length);
        }
        continue;
      }

      const dx = a.target.x - a.pos.x;
      const dy = a.target.y - a.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const destLoc = LOCATIONS[a.destination];
      const profile = getDevoteeProfile(a.devoteeType);
      const load = counts[a.destination] / destLoc.capacity;
      const rainSlow = eventEffects.serviceRateMultiplier < 0.8 ? 0.85 : 1;
      const slow = load > 0.9 ? 0.35 : load > 0.7 ? 0.6 : 1;
      const step = a.walkingSpeed * slow * rainSlow * dt;

      if (d <= step + 0.005) {
        a.pos.x = a.target.x;
        a.pos.y = a.target.y;

        const queuedAtLoc = countQueuedAgents(agents);
        const queueLen = queuedAtLoc[a.destination] ?? 0;

        if (
          shouldEnterQueue(a.destination, counts[a.destination], queueLen, profile.priority)
        ) {
          a.status = "Queued";
          a.queueWaitRemaining = computeQueueWait(
            a.destination,
            queueLen + 1,
            this.queueMetrics.arrivalRates[a.destination],
            profile.priority,
          );
          counts[a.destination] += 1;
          continue;
        }

        const { next, rerouted, routeIndex } = nextStop(
          a.route,
          a.destination,
          this.blockedEdges,
        );
        a.route = rerouted;
        a.routeIndex = routeIndex;

        if (!next) {
          a.status = "Exited";
          this.exited += 1;
          LiveAnalyticsTracker.recordTravel(this.tick - a.spawnAt);
          continue;
        }

        a.destination = next;
        a.target = jitter(LOCATIONS[next].pos, 0.035);
        a.progress = routeProgress(routeIndex, a.route.length);
        a.status = "Walking";
      } else {
        a.pos.x += (dx / d) * step;
        a.pos.y += (dy / d) * step;
        a.status = "Walking";
      }

      counts[a.destination] += 1;
    }

    updateArrivalRates(this.queueMetrics, scenario, dt, arrivalsThisStep);
    this.queueMetrics.queueLengths = countQueuedAgents(agents);

    const arrivalsSum = Object.values(arrivalsThisStep).reduce((s, v) => s + v, 0);
    this.arrivalRateEstimate =
      this.arrivalRateEstimate * 0.9 + (arrivalsSum / Math.max(dt, 0.001)) * 0.1;
    const exitDelta = this.exited - this.prevExited;
    this.exitRateEstimate = this.exitRateEstimate * 0.9 + (exitDelta / Math.max(dt, 0.001)) * 0.1;
    this.prevExited = this.exited;

    this.snapshotTimer += dt;
    if (this.snapshotTimer >= 1) {
      const seconds = Math.floor(this.snapshotTimer);
      this.snapshotTimer -= seconds;
      this.tick += seconds;
      this.updateSnapshot(counts);
      this.refresh();
    }
  }

  private updateSnapshot(counts: Record<LocationId, number>) {
    const queueState = buildQueueState(this.queueMetrics);
    const locations = computeLocationStats(counts, queueState);
    const active = this.agents.filter(
      (a) => a.status !== "Exited" && a.status !== "Pending",
    ).length;
    const waitingSeconds = computeWaitingSeconds(queueState);
    this.trend = updateTrend(this.trend, this.tick, active);
    const { congestionIndex } = computeCongestion(locations);

    const eventEffects = this.events.getEffects();
    const intelligence = buildIntelligenceSnapshot({
      tick: this.tick,
      scenario: this.scenario,
      agents: this.agents,
      counts,
      queueState,
      locations,
      congestionIndex,
      waitingSeconds,
      activeEvents: this.events.getActiveEvents(),
      eventEffects,
      blockedEdges: this.blockedEdges,
      exitedAgents: this.exited,
      reroutedCount: this.reroutedCount,
      arrivalRate: this.arrivalRateEstimate || getScenario(this.scenario).arrivalRate,
      exitRate: this.exitRateEstimate,
      emergencyRouteActive: this.isEmergencyMode(),
    });

    const pred30 = intelligence.predictions.find((p) => p.horizonMinutes === 30);
    if (pred30 && this.trend.length > 0) {
      this.trend[this.trend.length - 1].predicted = pred30.expectedCrowd;
    }

    this.snapshot = buildSnapshot(
      this.status,
      this.scenario,
      this.tick,
      this.agents.length,
      active,
      this.exited,
      locations,
      waitingSeconds,
      this.trend.slice(),
      intelligence,
    );
  }

  private refresh() {
    this.listeners.forEach((l) => l());
  }
}

export const engine = new SimulationEngine();

export function agentsRef() {
  return engine.agents;
}
