import type { EventType, LocationId, ScenarioId, SimEvent } from "./types";

export interface EventEffects {
  arrivalRateMultiplier: number;
  serviceRateMultiplier: number;
  blockedEdges: [LocationId, LocationId][];
  closedGates: LocationId[];
}

const EVENT_DEFINITIONS: Record<
  EventType,
  {
    duration: number;
    target?: LocationId;
    effects: Partial<EventEffects>;
  }
> = {
  "VIP Movement": {
    duration: 120,
    target: "VIPEntry",
    effects: { serviceRateMultiplier: 1.5, arrivalRateMultiplier: 0.85 },
  },
  "Medical Emergency": {
    duration: 180,
    target: "MedicalCenter",
    effects: {
      serviceRateMultiplier: 0.5,
      blockedEdges: [["Temple", "LadduCounter"]],
    },
  },
  "Temporary Gate Closure": {
    duration: 240,
    target: "MainGate",
    effects: { closedGates: ["MainGate"], arrivalRateMultiplier: 0.7 },
  },
  "Heavy Crowd": {
    duration: 300,
    effects: { arrivalRateMultiplier: 1.35, serviceRateMultiplier: 0.85 },
  },
  "Festival Peak": {
    duration: 600,
    effects: { arrivalRateMultiplier: 1.8, serviceRateMultiplier: 0.9 },
  },
  Fire: {
    duration: 300,
    target: "Temple",
    effects: {
      arrivalRateMultiplier: 0.4,
      serviceRateMultiplier: 0.3,
      blockedEdges: [
        ["Temple", "LadduCounter"],
        ["Temple", "PrasadamHall"],
        ["DarshanQueue", "Temple"],
      ],
      closedGates: ["MainGate"],
    },
  },
  Rain: {
    duration: 420,
    effects: {
      arrivalRateMultiplier: 0.85,
      serviceRateMultiplier: 0.75,
    },
  },
};

const SCENARIO_EVENTS: Partial<Record<ScenarioId, EventType[]>> = {
  Festival: ["Festival Peak", "Heavy Crowd"],
  Emergency: ["Medical Emergency", "Temporary Gate Closure"],
  Weekend: ["Heavy Crowd"],
};

export class EventManager {
  events: SimEvent[] = [];

  resetForScenario(scenario: ScenarioId): void {
    this.events = [];
    const scheduled = SCENARIO_EVENTS[scenario] ?? [];
    for (const type of scheduled) {
      this.trigger(type, 0);
    }
  }

  trigger(type: EventType, startTick: number, target?: LocationId): void {
    const def = EVENT_DEFINITIONS[type];
    this.events.push({
      type,
      startTick,
      duration: def.duration,
      target: target ?? def.target,
      active: true,
    });
  }

  tick(simTick: number): void {
    for (const ev of this.events) {
      if (simTick >= ev.startTick + ev.duration) ev.active = false;
    }
  }

  getActiveEvents(): SimEvent[] {
    return this.events.filter((e) => e.active);
  }

  getEffects(): EventEffects {
    const active = this.getActiveEvents();
    const effects: EventEffects = {
      arrivalRateMultiplier: 1,
      serviceRateMultiplier: 1,
      blockedEdges: [],
      closedGates: [],
    };

    for (const ev of active) {
      const def = EVENT_DEFINITIONS[ev.type];
      if (def.effects.arrivalRateMultiplier) {
        effects.arrivalRateMultiplier *= def.effects.arrivalRateMultiplier;
      }
      if (def.effects.serviceRateMultiplier) {
        effects.serviceRateMultiplier *= def.effects.serviceRateMultiplier;
      }
      if (def.effects.blockedEdges) {
        effects.blockedEdges.push(...def.effects.blockedEdges);
      }
      if (def.effects.closedGates) {
        effects.closedGates.push(...def.effects.closedGates);
      }
      if (ev.type === "Temporary Gate Closure" && ev.target) {
        if (!effects.closedGates.includes(ev.target)) {
          effects.closedGates.push(ev.target);
        }
      }
    }

    return effects;
  }

  activeEventLabels(): string[] {
    return this.getActiveEvents().map((e) => e.type);
  }
}

export function edgesToSet(edges: [LocationId, LocationId][]): Set<string> {
  return new Set(edges.map(([a, b]) => `${a}->${b}`));
}
