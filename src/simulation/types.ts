export type LocationId =
  | "MainGate"
  | "NorthGate"
  | "SouthGate"
  | "ParkingEntry"
  | "VIPEntry"
  | "SecurityCheck"
  | "TicketVerification"
  | "WaitingHall"
  | "DarshanQueue"
  | "Temple"
  | "LadduCounter"
  | "PrasadamHall"
  | "RestArea"
  | "MedicalCenter"
  | "Exit";

export type AgentStatus = "Pending" | "Walking" | "Queued" | "Served" | "Exited";

export type DevoteeType = "Adult" | "Senior Citizen" | "VIP" | "Family" | "Disabled";

export type RouteId = "normal" | "vip" | "senior" | "family" | "disabled" | "emergency";

export type ScenarioId = "Normal Day" | "Weekend" | "Festival" | "Emergency";

export type SimStatus = "idle" | "running" | "paused";

export type EventType =
  | "VIP Movement"
  | "Medical Emergency"
  | "Temporary Gate Closure"
  | "Heavy Crowd"
  | "Festival Peak"
  | "Fire"
  | "Rain";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Location {
  id: LocationId;
  label: string;
  pos: Vec2;
  capacity: number;
  /** Agents processed per second at this location */
  serviceRate: number;
  /** Valid next locations in the facility graph */
  connections: LocationId[];
  /** True for entry gates */
  isEntry?: boolean;
}

export interface RouteDefinition {
  id: RouteId;
  label: string;
  /** Preferred location sequence (entry → exit) */
  stops: LocationId[];
}

export interface DevoteeProfile {
  type: DevoteeType;
  walkingSpeed: { min: number; max: number };
  preferredRoute: RouteId;
  priority: number;
  /** Max seconds willing to wait before rerouting */
  waitingTolerance: number;
}

export interface Agent {
  id: number;
  pos: Vec2;
  target: Vec2;
  destination: LocationId;
  walkingSpeed: number;
  status: AgentStatus;
  /** 0..1 through assigned route */
  progress: number;
  devoteeType: DevoteeType;
  route: LocationId[];
  routeIndex: number;
  queueWaitRemaining: number;
  entryGate: LocationId;
  /** Simulated second when agent enters the facility */
  spawnAt: number;
  /** Assigned route identifier */
  routeId: RouteId;
  /** True if dynamically rerouted by the route optimizer */
  wasRerouted?: boolean;
}

export interface Scenario {
  id: ScenarioId;
  agentCount: number;
  /** Agents entering per simulated second */
  arrivalRate: number;
  /** Fraction of each devotee type (must sum to ~1) */
  devoteeMix: Record<DevoteeType, number>;
  /** Relative weight for entry gate selection (Adult/Family) */
  entryGateUsage: Partial<Record<LocationId, number>>;
  /** Preferred route weights for generic devotees */
  routeWeights: Partial<Record<RouteId, number>>;
  /** Blocked directed edges [from, to] */
  blockedEdges?: [LocationId, LocationId][];
  /** Events auto-triggered when scenario starts */
  events?: EventType[];
}

export interface SimEvent {
  type: EventType;
  startTick: number;
  duration: number;
  /** Affected location or gate */
  target?: LocationId;
  active: boolean;
}

export interface LocationStat {
  id: LocationId;
  label: string;
  count: number;
  capacity: number;
  load: number;
  level: "low" | "medium" | "high" | "critical";
}

export interface SimSnapshot {
  status: SimStatus;
  scenario: ScenarioId;
  tick: number;
  totalAgents: number;
  activeAgents: number;
  exitedAgents: number;
  congestionIndex: number;
  congestionLabel: "Low" | "Moderate" | "High" | "Critical";
  waitingSeconds: number;
  locations: LocationStat[];
  trend: { t: number; crowd: number; predicted: number }[];
  intelligence: IntelligenceSnapshot;
}

export interface QueueState {
  /** Current queue length per location */
  lengths: Record<LocationId, number>;
  /** Estimated wait seconds per location */
  waitSeconds: Record<LocationId, number>;
}

export type PredictionConfidence = "Low" | "Medium" | "High";

export type RouteHealthStatus =
  | "Optimal"
  | "Recommended"
  | "Moderate"
  | "Busy"
  | "Critical"
  | "Blocked";

export type AlertSeverity = "Info" | "Warning" | "Critical";

export type SystemStatus = "Normal" | "Elevated" | "Critical";

export interface CrowdPrediction {
  horizonMinutes: 5 | 10 | 30;
  expectedCrowd: number;
  expectedCongestion: number;
  confidence: PredictionConfidence;
}

export interface RouteHealth {
  routeId: RouteId;
  label: string;
  travelTimeSeconds: number;
  crowdDensity: number;
  capacity: number;
  loadPercent: number;
  healthScore: number;
  status: RouteHealthStatus;
  queueLength: number;
  estimatedWaitSeconds: number;
}

export interface SmartAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  tick: number;
}

export interface DecisionRecommendation {
  id: string;
  action: string;
  reason: string;
  priority: "Low" | "Medium" | "High";
}

export interface LiveAnalytics {
  avgTravelTimeSeconds: number;
  queueThroughput: number;
  peopleServedPerMinute: number;
  avgWaitingTimeSeconds: number;
  mostUsedRoute: RouteId;
  leastUsedRoute: RouteId;
  routeUtilization: Partial<Record<RouteId, number>>;
  reroutedDevotees: number;
}

export interface CrowdMetrics {
  currentCrowd: number;
  arrivalRate: number;
  exitRate: number;
  queueGrowth: number;
  congestionTrend: number;
}

export interface CommandCenterState {
  alerts: SmartAlert[];
  bestRoute: RouteHealth | null;
  worstRoute: RouteHealth | null;
  mostCrowdedLocation: LocationStat | null;
  predictions: CrowdPrediction[];
  suggestedActions: DecisionRecommendation[];
  systemStatus: SystemStatus;
  activeIncidents: string[];
  recommendedRouteLabel: string;
}

export interface IntelligenceSnapshot {
  metrics: CrowdMetrics;
  predictions: CrowdPrediction[];
  overallConfidence: PredictionConfidence;
  routeHealth: RouteHealth[];
  recommendedRouteId: RouteId | null;
  alerts: SmartAlert[];
  recommendations: DecisionRecommendation[];
  analytics: LiveAnalytics;
  commandCenter: CommandCenterState;
}
