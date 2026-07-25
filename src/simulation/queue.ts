import { emptyLocationCounts, LOCATIONS } from "./locations";
import type { Agent, LocationId, QueueState, Scenario } from "./types";

export interface QueueMetrics {
  /** Effective arrival rate (agents/s) at each location */
  arrivalRates: Record<LocationId, number>;
  /** Agents currently waiting (Queued status) */
  queueLengths: Record<LocationId, number>;
}

export function initQueueMetrics(): QueueMetrics {
  return {
    arrivalRates: emptyLocationCounts(),
    queueLengths: emptyLocationCounts(),
  };
}

/**
 * M/M/1-inspired wait estimate using queue length, arrival rate, and service rate.
 * Wq ≈ Lq / μ when congested; otherwise uses utilization-based formula.
 */
export function estimateWaitSeconds(
  locationId: LocationId,
  queueLength: number,
  arrivalRate: number,
): number {
  const loc = LOCATIONS[locationId];
  const mu = loc.serviceRate;
  if (mu <= 0) return 0;

  const lambda = Math.max(0.01, arrivalRate);
  const rho = Math.min(0.99, lambda / mu);

  if (queueLength <= 0) {
    return rho > 0.85 ? (rho / (mu * (1 - rho))) * 60 : 0;
  }

  const baseWait = queueLength / mu;
  const utilizationPenalty = 1 + rho * rho * 2;
  return Math.max(5, baseWait * utilizationPenalty);
}

export function shouldEnterQueue(
  locationId: LocationId,
  currentCount: number,
  queueLength: number,
  agentPriority: number,
): boolean {
  const loc = LOCATIONS[locationId];
  const totalOccupancy = currentCount + queueLength;
  const load = totalOccupancy / loc.capacity;

  if (load < 0.55) return false;
  if (load >= 1.0) return true;

  const queueThreshold = 0.65 - agentPriority * 0.08;
  return load >= queueThreshold && queueLength < loc.capacity * 0.5;
}

export function computeQueueWait(
  locationId: LocationId,
  queueLength: number,
  arrivalRate: number,
  agentPriority: number,
): number {
  const base = estimateWaitSeconds(locationId, queueLength, arrivalRate);
  const priorityFactor = 1 - agentPriority * 0.12;
  return Math.max(3, base * Math.max(0.4, priorityFactor));
}

export function buildQueueState(metrics: QueueMetrics): QueueState {
  const waitSeconds = emptyLocationCounts();
  for (const id of Object.keys(LOCATIONS) as LocationId[]) {
    waitSeconds[id] = Math.round(
      estimateWaitSeconds(id, metrics.queueLengths[id], metrics.arrivalRates[id]),
    );
  }
  return { lengths: { ...metrics.queueLengths }, waitSeconds };
}

/** Rolling arrival rate from scenario baseline and recent activations */
export function scenarioArrivalRate(scenario: Scenario, multiplier = 1): number {
  return scenario.arrivalRate * multiplier;
}

export function updateArrivalRates(
  metrics: QueueMetrics,
  scenario: Scenario,
  dt: number,
  arrivalsThisStep: Record<LocationId, number>,
): void {
  const alpha = Math.min(1, dt * 0.5);
  const baseline = scenarioArrivalRate(scenario) / 5;

  for (const id of Object.keys(LOCATIONS) as LocationId[]) {
    const observed = arrivalsThisStep[id] / Math.max(dt, 0.001);
    metrics.arrivalRates[id] =
      metrics.arrivalRates[id] * (1 - alpha) + (observed + baseline * 0.1) * alpha;
  }
}

export function countQueuedAgents(agents: Agent[]): Record<LocationId, number> {
  const lengths = emptyLocationCounts();
  for (const a of agents) {
    if (a.status === "Queued") lengths[a.destination] += 1;
  }
  return lengths;
}
