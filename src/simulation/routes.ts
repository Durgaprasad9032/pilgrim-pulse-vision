import { LOCATIONS } from "./locations";
import type { LocationId, RouteDefinition, RouteId } from "./types";

export const ROUTES: Record<RouteId, RouteDefinition> = {
  normal: {
    id: "normal",
    label: "Normal Route",
    stops: [
      "MainGate",
      "SecurityCheck",
      "TicketVerification",
      "WaitingHall",
      "DarshanQueue",
      "Temple",
      "LadduCounter",
      "Exit",
    ],
  },
  vip: {
    id: "vip",
    label: "VIP Route",
    stops: ["VIPEntry", "Temple", "Exit"],
  },
  senior: {
    id: "senior",
    label: "Senior Citizen Route",
    stops: ["ParkingEntry", "MedicalCenter", "WaitingHall", "DarshanQueue", "Temple", "Exit"],
  },
  family: {
    id: "family",
    label: "Family Route",
    stops: [
      "MainGate",
      "SecurityCheck",
      "TicketVerification",
      "WaitingHall",
      "DarshanQueue",
      "Temple",
      "LadduCounter",
      "PrasadamHall",
      "RestArea",
      "Exit",
    ],
  },
  disabled: {
    id: "disabled",
    label: "Accessible Route",
    stops: ["ParkingEntry", "MedicalCenter", "WaitingHall", "DarshanQueue", "Temple", "Exit"],
  },
  emergency: {
    id: "emergency",
    label: "Emergency Route",
    stops: [], // built dynamically
  },
};

/** Alternate entry paths that merge into the normal flow */
export const GATE_ROUTE_PREFIX: Partial<Record<LocationId, LocationId[]>> = {
  NorthGate: ["NorthGate", "SecurityCheck"],
  SouthGate: ["SouthGate", "SecurityCheck"],
  MainGate: ["MainGate", "SecurityCheck"],
};

export function buildRoute(
  routeId: RouteId,
  entryGate: LocationId,
  blockedEdges: Set<string>,
): LocationId[] {
  const base = ROUTES[routeId].stops;
  let route: LocationId[];

  if (routeId === "normal" || routeId === "family") {
    const prefix = GATE_ROUTE_PREFIX[entryGate] ?? ["MainGate", "SecurityCheck"];
    const suffix = base.slice(base.indexOf("SecurityCheck") + 1);
    route = [...prefix, ...suffix];
  } else if (routeId === "vip") {
    route = ["VIPEntry", "Temple", "Exit"];
  } else if (routeId === "senior" || routeId === "disabled") {
    route = [...ROUTES[routeId].stops];
  } else {
    route = [...base];
  }

  return rerouteBlocked(route, blockedEdges);
}

export function rerouteBlocked(route: LocationId[], blockedEdges: Set<string>): LocationId[] {
  if (blockedEdges.size === 0) return route;

  const result: LocationId[] = [route[0]];
  for (let i = 0; i < route.length - 1; i++) {
    const from = result[result.length - 1];
    const planned = route[i + 1];
    const edgeKey = `${from}->${planned}`;

    if (!blockedEdges.has(edgeKey) && LOCATIONS[from].connections.includes(planned)) {
      result.push(planned);
      continue;
    }

    const alt = findAlternateNext(from, planned, route.slice(i + 1), blockedEdges);
    if (!alt) break;
    result.push(alt);
  }

  if (result[result.length - 1] !== "Exit") {
    const tail = findPathToExit(result[result.length - 1], blockedEdges);
    if (tail.length > 1) result.push(...tail.slice(1));
  }

  return dedupeConsecutive(result);
}

function dedupeConsecutive(route: LocationId[]): LocationId[] {
  return route.filter((loc, i) => i === 0 || loc !== route[i - 1]);
}

function findAlternateNext(
  from: LocationId,
  preferred: LocationId,
  remaining: LocationId[],
  blocked: Set<string>,
): LocationId | null {
  const options = LOCATIONS[from].connections.filter((c) => !blocked.has(`${from}->${c}`));
  if (options.length === 0) return null;

  for (const target of remaining) {
    if (options.includes(target)) return target;
  }

  if (options.includes(preferred)) return preferred;
  return options[0] ?? null;
}

function findPathToExit(start: LocationId, blocked: Set<string>): LocationId[] {
  const queue: { node: LocationId; path: LocationId[] }[] = [{ node: start, path: [start] }];
  const visited = new Set<LocationId>([start]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    if (node === "Exit") return path;

    for (const next of LOCATIONS[node].connections) {
      if (visited.has(next) || blocked.has(`${node}->${next}`)) continue;
      visited.add(next);
      queue.push({ node: next, path: [...path, next] });
    }
  }

  return [start, "Exit"];
}

export function nextStop(
  route: LocationId[],
  currentLocation: LocationId,
  blockedEdges: Set<string>,
): { next: LocationId | null; rerouted: LocationId[]; routeIndex: number } {
  const rerouted = rerouteBlocked(route, blockedEdges);
  const routeIndex = rerouted.indexOf(currentLocation);
  if (routeIndex < 0) {
    return { next: rerouted[1] ?? null, rerouted, routeIndex: 0 };
  }
  const next = rerouted[routeIndex + 1] ?? null;
  return { next, rerouted, routeIndex };
}

export function routeProgress(routeIndex: number, routeLength: number): number {
  if (routeLength <= 1) return 1;
  return Math.min(1, routeIndex / (routeLength - 1));
}
