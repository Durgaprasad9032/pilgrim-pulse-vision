import type {
  Agent,
  Location,
  LocationId,
  LocationStat,
  Scenario,
  ScenarioId,
  SimSnapshot,
  SimStatus,
  Vec2,
} from "./types";

export const LOCATIONS: Record<LocationId, Location> = {
  MainGate: { id: "MainGate", label: "Main Gate", pos: { x: 0.12, y: 0.82 }, capacity: 600, next: "DarshanQueue" },
  DarshanQueue: { id: "DarshanQueue", label: "Darshan Queue", pos: { x: 0.36, y: 0.55 }, capacity: 350, next: "Temple" },
  Temple: { id: "Temple", label: "Temple", pos: { x: 0.55, y: 0.3 }, capacity: 450, next: "PrasadamHall" },
  PrasadamHall: { id: "PrasadamHall", label: "Prasadam Hall", pos: { x: 0.75, y: 0.55 }, capacity: 350, next: "Exit" },
  Exit: { id: "Exit", label: "Exit Gate", pos: { x: 0.88, y: 0.82 }, capacity: 700, next: null },
};

export const LOCATION_ORDER: LocationId[] = [
  "MainGate",
  "DarshanQueue",
  "Temple",
  "PrasadamHall",
  "Exit",
];

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  "Normal Day": { id: "Normal Day", agentCount: 1000 },
  Weekend: { id: "Weekend", agentCount: 3000 },
  Festival: { id: "Festival", agentCount: 10000 },
  Emergency: { id: "Emergency", agentCount: 2000, blockedEdge: ["Temple", "PrasadamHall"] },
};

function jitter(p: Vec2, r = 0.03): Vec2 {
  const a = Math.random() * Math.PI * 2;
  const d = Math.random() * r;
  return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
}

function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

class SimulationEngine {
  agents: Agent[] = [];
  status: SimStatus = "idle";
  scenario: ScenarioId = "Weekend";
  tick = 0;
  exited = 0;
  private lastFrame = 0;
  private accumulator = 0;
  private rafId: number | null = null;
  private snapshot: SimSnapshot = this.buildSnapshot();
  private listeners = new Set<() => void>();
  private trend: { t: number; crowd: number; predicted: number }[] = [];
  private snapshotTimer = 0;

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
    this.accumulator = 0;
    this.snapshotTimer = 0;
    this.trend = [];
    this.spawn();
    this.refresh();
  }

  private spawn() {
    const s = SCENARIOS[this.scenario];
    const arr: Agent[] = new Array(s.agentCount);
    const gate = LOCATIONS.MainGate.pos;
    for (let i = 0; i < s.agentCount; i++) {
      const start = jitter(gate, 0.04);
      arr[i] = {
        id: i,
        pos: start,
        target: jitter(LOCATIONS.DarshanQueue.pos, 0.03),
        destination: "DarshanQueue",
        walkingSpeed: 0.008 + Math.random() * 0.018, // per second
        status: "Walking",
        progress: 0,
      };
    }
    // Stagger arrival by hiding some at gate initially — represent via random distances.
    this.agents = arr;
  }

  private nextDestination(current: LocationId): LocationId | null {
    const blocked = SCENARIOS[this.scenario].blockedEdge;
    const loc = LOCATIONS[current];
    if (loc.next && blocked && blocked[0] === current && blocked[1] === loc.next) {
      // route around: skip to next-next
      const skip = LOCATIONS[loc.next].next;
      return skip;
    }
    return loc.next;
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
    this.accumulator += dt;
    // per-location current counts (destinations)
    const counts: Record<LocationId, number> = {
      MainGate: 0,
      DarshanQueue: 0,
      Temple: 0,
      PrasadamHall: 0,
      Exit: 0,
    };

    const agents = this.agents;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (a.status === "Exited") continue;

      const dx = a.target.x - a.pos.x;
      const dy = a.target.y - a.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      // congestion slow-down as destination fills
      const destLoc = LOCATIONS[a.destination];
      const load = counts[a.destination] / destLoc.capacity;
      const slow = load > 0.9 ? 0.35 : load > 0.7 ? 0.6 : 1;
      const step = a.walkingSpeed * slow * dt;

      if (d <= step + 0.005) {
        // arrived at destination waypoint
        a.pos.x = a.target.x;
        a.pos.y = a.target.y;
        const nxt = this.nextDestination(a.destination);
        if (!nxt) {
          a.status = "Exited";
          this.exited += 1;
          continue;
        }
        // brief queue at popular stops (probabilistic hold)
        const holdProb = load > 0.8 ? 0.9 : load > 0.5 ? 0.6 : 0.3;
        if (Math.random() < holdProb && a.destination !== "Exit") {
          a.status = "Queued";
        } else {
          a.status = "Walking";
        }
        a.destination = nxt;
        a.target = jitter(LOCATIONS[nxt].pos, 0.035);
        a.progress = Math.min(1, a.progress + 0.25);
      } else {
        a.pos.x += (dx / d) * step;
        a.pos.y += (dy / d) * step;
        a.status = "Walking";
      }

      counts[a.destination] += 1;
    }

    // fixed 1s tick for snapshot / trend / dashboard cards
    this.snapshotTimer += dt;
    if (this.snapshotTimer >= 1) {
      const seconds = Math.floor(this.snapshotTimer);
      this.snapshotTimer -= seconds;
      this.tick += seconds;
      this.updateSnapshot(counts);
      this.refresh();
    }
  }

  private computeLocations(counts: Record<LocationId, number>): LocationStat[] {
    return LOCATION_ORDER.map((id) => {
      const loc = LOCATIONS[id];
      const c = counts[id];
      const load = c / loc.capacity;
      const level =
        load > 1 ? "critical" : load > 0.75 ? "high" : load > 0.45 ? "medium" : "low";
      return { id, label: loc.label, count: c, capacity: loc.capacity, load, level };
    });
  }

  private updateSnapshot(counts: Record<LocationId, number>) {
    const locations = this.computeLocations(counts);
    const active = this.agents.length - this.exited;
    const totalLoad = locations.reduce((s, l) => s + Math.min(1.5, l.load), 0) / locations.length;
    const congestionIndex = Math.round(Math.min(100, totalLoad * 80));
    const congestionLabel: SimSnapshot["congestionLabel"] =
      congestionIndex > 80 ? "Critical" : congestionIndex > 60 ? "High" : congestionIndex > 35 ? "Moderate" : "Low";

    const darshan = locations.find((l) => l.id === "DarshanQueue")!;
    // waiting time (seconds): base 60 + load^2 * 900
    const waitingSeconds = Math.round(60 + Math.pow(darshan.load, 2) * 900);

    this.trend.push({
      t: this.tick,
      crowd: active,
      predicted: Math.round(active * (1 + Math.sin(this.tick / 20) * 0.08 + 0.05)),
    });
    if (this.trend.length > 60) this.trend.shift();

    this.snapshot = {
      status: this.status,
      scenario: this.scenario,
      tick: this.tick,
      totalAgents: this.agents.length,
      activeAgents: active,
      exitedAgents: this.exited,
      congestionIndex,
      congestionLabel,
      waitingSeconds,
      locations,
      trend: this.trend.slice(),
    };
  }

  private buildSnapshot(): SimSnapshot {
    return {
      status: "idle",
      scenario: this.scenario,
      tick: 0,
      totalAgents: 0,
      activeAgents: 0,
      exitedAgents: 0,
      congestionIndex: 0,
      congestionLabel: "Low",
      waitingSeconds: 0,
      locations: LOCATION_ORDER.map((id) => ({
        id,
        label: LOCATIONS[id].label,
        count: 0,
        capacity: LOCATIONS[id].capacity,
        load: 0,
        level: "low",
      })),
      trend: [],
    };
  }

  private refresh() {
    this.listeners.forEach((l) => l());
  }
}

export const engine = new SimulationEngine();

// helper for map renderer
export function agentsRef() {
  return engine.agents;
}

export { dist };
