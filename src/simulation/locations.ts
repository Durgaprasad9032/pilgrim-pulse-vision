import type { Location, LocationId } from "./types";

export const LOCATIONS: Record<LocationId, Location> = {
  MainGate: {
    id: "MainGate",
    label: "Main Gate",
    pos: { x: 0.12, y: 0.82 },
    capacity: 600,
    serviceRate: 18,
    connections: ["SecurityCheck"],
    isEntry: true,
  },
  NorthGate: {
    id: "NorthGate",
    label: "North Gate",
    pos: { x: 0.35, y: 0.08 },
    capacity: 400,
    serviceRate: 14,
    connections: ["SecurityCheck"],
    isEntry: true,
  },
  SouthGate: {
    id: "SouthGate",
    label: "South Gate",
    pos: { x: 0.65, y: 0.08 },
    capacity: 400,
    serviceRate: 14,
    connections: ["SecurityCheck"],
    isEntry: true,
  },
  ParkingEntry: {
    id: "ParkingEntry",
    label: "Parking Entry",
    pos: { x: 0.08, y: 0.45 },
    capacity: 500,
    serviceRate: 12,
    connections: ["MedicalCenter", "TicketVerification"],
    isEntry: true,
  },
  VIPEntry: {
    id: "VIPEntry",
    label: "VIP Entry",
    pos: { x: 0.88, y: 0.15 },
    capacity: 120,
    serviceRate: 8,
    connections: ["Temple"],
    isEntry: true,
  },
  SecurityCheck: {
    id: "SecurityCheck",
    label: "Security Check",
    pos: { x: 0.22, y: 0.65 },
    capacity: 280,
    serviceRate: 10,
    connections: ["TicketVerification"],
  },
  TicketVerification: {
    id: "TicketVerification",
    label: "Ticket Verification",
    pos: { x: 0.28, y: 0.55 },
    capacity: 220,
    serviceRate: 12,
    connections: ["WaitingHall"],
  },
  WaitingHall: {
    id: "WaitingHall",
    label: "Waiting Hall",
    pos: { x: 0.32, y: 0.48 },
    capacity: 400,
    serviceRate: 15,
    connections: ["DarshanQueue"],
  },
  DarshanQueue: {
    id: "DarshanQueue",
    label: "Darshan Queue",
    pos: { x: 0.36, y: 0.55 },
    capacity: 350,
    serviceRate: 8,
    connections: ["Temple"],
  },
  Temple: {
    id: "Temple",
    label: "Temple",
    pos: { x: 0.55, y: 0.3 },
    capacity: 450,
    serviceRate: 6,
    connections: ["LadduCounter", "PrasadamHall", "Exit"],
  },
  LadduCounter: {
    id: "LadduCounter",
    label: "Laddu Counter",
    pos: { x: 0.68, y: 0.42 },
    capacity: 200,
    serviceRate: 10,
    connections: ["PrasadamHall", "Exit"],
  },
  PrasadamHall: {
    id: "PrasadamHall",
    label: "Prasadam Hall",
    pos: { x: 0.75, y: 0.55 },
    capacity: 350,
    serviceRate: 9,
    connections: ["RestArea", "Exit"],
  },
  RestArea: {
    id: "RestArea",
    label: "Rest Area",
    pos: { x: 0.82, y: 0.68 },
    capacity: 300,
    serviceRate: 20,
    connections: ["Exit"],
  },
  MedicalCenter: {
    id: "MedicalCenter",
    label: "Medical Center",
    pos: { x: 0.15, y: 0.35 },
    capacity: 150,
    serviceRate: 5,
    connections: ["WaitingHall", "Temple"],
  },
  Exit: {
    id: "Exit",
    label: "Exit Gate",
    pos: { x: 0.88, y: 0.82 },
    capacity: 700,
    serviceRate: 25,
    connections: [],
  },
};

/** Entry gates for spawn distribution */
export const ENTRY_POINTS: LocationId[] = [
  "MainGate",
  "NorthGate",
  "SouthGate",
  "ParkingEntry",
  "VIPEntry",
];

/** Dashboard / map display order (all facility zones) */
export const LOCATION_ORDER: LocationId[] = [
  "MainGate",
  "NorthGate",
  "SouthGate",
  "ParkingEntry",
  "VIPEntry",
  "SecurityCheck",
  "TicketVerification",
  "WaitingHall",
  "DarshanQueue",
  "Temple",
  "LadduCounter",
  "PrasadamHall",
  "RestArea",
  "MedicalCenter",
  "Exit",
];

/** All location ids for counting */
export const ALL_LOCATION_IDS: LocationId[] = Object.keys(LOCATIONS) as LocationId[];

/** Route segments drawn on the digital twin map */
export const MAP_ROUTE_EDGES: [LocationId, LocationId][] = [
  ["MainGate", "SecurityCheck"],
  ["NorthGate", "SecurityCheck"],
  ["SouthGate", "SecurityCheck"],
  ["ParkingEntry", "MedicalCenter"],
  ["ParkingEntry", "TicketVerification"],
  ["VIPEntry", "Temple"],
  ["SecurityCheck", "TicketVerification"],
  ["TicketVerification", "WaitingHall"],
  ["WaitingHall", "DarshanQueue"],
  ["DarshanQueue", "Temple"],
  ["MedicalCenter", "WaitingHall"],
  ["MedicalCenter", "Temple"],
  ["Temple", "LadduCounter"],
  ["Temple", "PrasadamHall"],
  ["Temple", "Exit"],
  ["LadduCounter", "PrasadamHall"],
  ["LadduCounter", "Exit"],
  ["PrasadamHall", "RestArea"],
  ["PrasadamHall", "Exit"],
  ["RestArea", "Exit"],
];

export function emptyLocationCounts(): Record<LocationId, number> {
  const counts = {} as Record<LocationId, number>;
  for (const id of ALL_LOCATION_IDS) counts[id] = 0;
  return counts;
}

export function jitter(p: Vec2, r = 0.03): Vec2 {
  const a = Math.random() * Math.PI * 2;
  const d = Math.random() * r;
  return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
