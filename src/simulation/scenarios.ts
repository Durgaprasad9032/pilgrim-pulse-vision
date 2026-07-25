import type { DevoteeType, LocationId, RouteId, Scenario, ScenarioId } from "./types";

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  "Normal Day": {
    id: "Normal Day",
    agentCount: 1000,
    arrivalRate: 4,
    devoteeMix: {
      Adult: 0.55,
      "Senior Citizen": 0.12,
      VIP: 0.03,
      Family: 0.25,
      Disabled: 0.05,
    },
    entryGateUsage: {
      MainGate: 0.45,
      NorthGate: 0.2,
      SouthGate: 0.15,
      ParkingEntry: 0.2,
    },
    routeWeights: {
      normal: 0.75,
      family: 0.25,
    },
  },
  Weekend: {
    id: "Weekend",
    agentCount: 3000,
    arrivalRate: 12,
    devoteeMix: {
      Adult: 0.5,
      "Senior Citizen": 0.1,
      VIP: 0.05,
      Family: 0.3,
      Disabled: 0.05,
    },
    entryGateUsage: {
      MainGate: 0.4,
      NorthGate: 0.22,
      SouthGate: 0.18,
      ParkingEntry: 0.2,
    },
    routeWeights: {
      normal: 0.6,
      family: 0.4,
    },
    events: ["Heavy Crowd"],
  },
  Festival: {
    id: "Festival",
    agentCount: 10000,
    arrivalRate: 35,
    devoteeMix: {
      Adult: 0.45,
      "Senior Citizen": 0.08,
      VIP: 0.07,
      Family: 0.35,
      Disabled: 0.05,
    },
    entryGateUsage: {
      MainGate: 0.3,
      NorthGate: 0.25,
      SouthGate: 0.25,
      ParkingEntry: 0.2,
    },
    routeWeights: {
      normal: 0.55,
      family: 0.45,
    },
    events: ["Festival Peak", "Heavy Crowd"],
  },
  Emergency: {
    id: "Emergency",
    agentCount: 2000,
    arrivalRate: 8,
    devoteeMix: {
      Adult: 0.5,
      "Senior Citizen": 0.15,
      VIP: 0.02,
      Family: 0.28,
      Disabled: 0.05,
    },
    entryGateUsage: {
      MainGate: 0.2,
      NorthGate: 0.3,
      SouthGate: 0.3,
      ParkingEntry: 0.2,
    },
    routeWeights: {
      normal: 0.7,
      family: 0.3,
    },
    blockedEdges: [
      ["Temple", "LadduCounter"],
      ["Temple", "PrasadamHall"],
    ],
    events: ["Medical Emergency", "Temporary Gate Closure"],
  },
};

export function getScenario(id: ScenarioId): Scenario {
  return SCENARIOS[id];
}

export function effectiveEntryGateUsage(
  scenario: Scenario,
  closedGates: LocationId[],
): Partial<Record<LocationId, number>> {
  const usage = { ...scenario.entryGateUsage };
  for (const gate of closedGates) {
    delete usage[gate];
  }
  const total = Object.values(usage).reduce((s, v) => s + (v ?? 0), 0);
  if (total <= 0) return { NorthGate: 0.5, SouthGate: 0.5 };
  const normalized = {} as Partial<Record<LocationId, number>>;
  for (const [k, v] of Object.entries(usage)) {
    normalized[k as LocationId] = (v ?? 0) / total;
  }
  return normalized;
}

export function pickRouteForMix(weights: Partial<Record<RouteId, number>>): RouteId {
  const entries = Object.entries(weights).filter(([, w]) => (w as number) > 0) as [
    RouteId,
    number,
  ][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  return entries[0]?.[0] ?? "normal";
}

export function devoteeMixLabel(mix: Record<DevoteeType, number>): string {
  return (Object.entries(mix) as [DevoteeType, number][])
    .filter(([, v]) => v >= 0.1)
    .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
    .join(" · ");
}
