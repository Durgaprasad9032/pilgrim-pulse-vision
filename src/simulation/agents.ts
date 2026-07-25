import { jitter, LOCATIONS } from "./locations";
import { buildRoute } from "./routes";
import type {
  Agent,
  DevoteeProfile,
  DevoteeType,
  LocationId,
  RouteId,
  Scenario,
} from "./types";

export const DEVOTEE_TYPES: Record<DevoteeType, DevoteeProfile> = {
  Adult: {
    type: "Adult",
    walkingSpeed: { min: 0.009, max: 0.022 },
    preferredRoute: "normal",
    priority: 1,
    waitingTolerance: 420,
  },
  "Senior Citizen": {
    type: "Senior Citizen",
    walkingSpeed: { min: 0.004, max: 0.009 },
    preferredRoute: "senior",
    priority: 2,
    waitingTolerance: 900,
  },
  VIP: {
    type: "VIP",
    walkingSpeed: { min: 0.012, max: 0.02 },
    preferredRoute: "vip",
    priority: 4,
    waitingTolerance: 120,
  },
  Family: {
    type: "Family",
    walkingSpeed: { min: 0.007, max: 0.015 },
    preferredRoute: "family",
    priority: 1,
    waitingTolerance: 600,
  },
  Disabled: {
    type: "Disabled",
    walkingSpeed: { min: 0.003, max: 0.007 },
    preferredRoute: "disabled",
    priority: 3,
    waitingTolerance: 1200,
  },
};

const DEVOTEE_TYPES_LIST: DevoteeType[] = [
  "Adult",
  "Senior Citizen",
  "VIP",
  "Family",
  "Disabled",
];

function pickWeighted<T extends string>(weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights).filter(([, w]) => (w as number) > 0) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function pickDevoteeType(scenario: Scenario): DevoteeType {
  return pickWeighted(scenario.devoteeMix);
}

export function pickEntryGate(type: DevoteeType, scenario: Scenario): LocationId {
  if (type === "VIP") return "VIPEntry";
  if (type === "Senior Citizen" || type === "Disabled") return "ParkingEntry";

  const weights = scenario.entryGateUsage;
  const gate = pickWeighted(weights);
  return gate ?? "MainGate";
}

export function pickRouteId(type: DevoteeType, scenario: Scenario): RouteId {
  const profile = DEVOTEE_TYPES[type];
  if (type === "VIP") return "vip";
  if (type === "Senior Citizen") return "senior";
  if (type === "Disabled") return "disabled";
  if (type === "Family") return "family";

  return pickWeighted(scenario.routeWeights) ?? profile.preferredRoute;
}

function interArrivalTimes(count: number, rate: number): number[] {
  const times: number[] = new Array(count);
  let t = 0;
  for (let i = 0; i < count; i++) {
    t += -Math.log(Math.max(1e-6, Math.random())) / rate;
    times[i] = t;
  }
  return times;
}

export function createAgents(scenario: Scenario, blockedEdges: Set<string>): Agent[] {
  const spawnTimes = interArrivalTimes(scenario.agentCount, scenario.arrivalRate);
  const agents: Agent[] = new Array(scenario.agentCount);

  for (let i = 0; i < scenario.agentCount; i++) {
    const devoteeType = pickDevoteeType(scenario);
    const entryGate = pickEntryGate(devoteeType, scenario);
    const routeId = pickRouteId(devoteeType, scenario);
    const route = buildRoute(routeId, entryGate, blockedEdges);
    const profile = DEVOTEE_TYPES[devoteeType];
    const speed =
      profile.walkingSpeed.min +
      Math.random() * (profile.walkingSpeed.max - profile.walkingSpeed.min);

    const firstStop = route[1] ?? route[0];
    const entryPos = jitter(LOCATIONS[entryGate].pos, 0.04);

    agents[i] = {
      id: i,
      pos: entryPos,
      target: jitter(LOCATIONS[firstStop].pos, 0.03),
      destination: firstStop,
      walkingSpeed: speed,
      status: "Pending",
      progress: 0,
      devoteeType,
      route,
      routeIndex: 0,
      queueWaitRemaining: 0,
      entryGate,
      spawnAt: spawnTimes[i],
      routeId,
      wasRerouted: false,
    };
  }

  return agents;
}

export function getDevoteeProfile(type: DevoteeType): DevoteeProfile {
  return DEVOTEE_TYPES[type];
}

export { DEVOTEE_TYPES_LIST };
