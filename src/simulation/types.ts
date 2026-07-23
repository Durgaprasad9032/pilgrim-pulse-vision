export type LocationId =
  | "MainGate"
  | "DarshanQueue"
  | "Temple"
  | "PrasadamHall"
  | "Exit";

export type AgentStatus = "Walking" | "Queued" | "Served" | "Exited";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Location {
  id: LocationId;
  label: string;
  pos: Vec2; // normalized 0..1 map coords
  capacity: number;
  next: LocationId | null;
}

export interface Agent {
  id: number;
  pos: Vec2;
  target: Vec2;
  destination: LocationId;
  walkingSpeed: number; // normalized units per second
  status: AgentStatus;
  progress: number; // 0..1 through full pilgrimage
}

export type ScenarioId = "Normal Day" | "Weekend" | "Festival" | "Emergency";

export interface Scenario {
  id: ScenarioId;
  agentCount: number;
  blockedEdge?: [LocationId, LocationId];
}

export type SimStatus = "idle" | "running" | "paused";

export interface LocationStat {
  id: LocationId;
  label: string;
  count: number;
  capacity: number;
  load: number; // 0..1+
  level: "low" | "medium" | "high" | "critical";
}

export interface SimSnapshot {
  status: SimStatus;
  scenario: ScenarioId;
  tick: number; // simulated seconds elapsed
  totalAgents: number;
  activeAgents: number;
  exitedAgents: number;
  congestionIndex: number; // 0..100
  congestionLabel: "Low" | "Moderate" | "High" | "Critical";
  waitingSeconds: number;
  locations: LocationStat[];
  trend: { t: number; crowd: number; predicted: number }[];
}
