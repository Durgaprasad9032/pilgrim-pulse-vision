import type {
  LocationStat,
  RouteHealth,
  SimEvent,
  SmartAlert,
} from "./types";

export interface AlertContext {
  tick: number;
  locations: LocationStat[];
  routeHealth: RouteHealth[];
  waitingSeconds: number;
  activeEvents: SimEvent[];
  emergencyRouteActive: boolean;
  reroutedCount: number;
}

let alertCounter = 0;

function mkAlert(
  severity: SmartAlert["severity"],
  title: string,
  message: string,
  tick: number,
): SmartAlert {
  alertCounter += 1;
  return { id: `alert-${alertCounter}`, severity, title, message, tick };
}

export function generateSmartAlerts(ctx: AlertContext): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  const temple = ctx.locations.find((l) => l.id === "Temple");
  if (temple && temple.load >= 0.9) {
    alerts.push(
      mkAlert(
        "Critical",
        "Temple congestion exceeds 90%",
        `${temple.count} / ${temple.capacity} agents · ${Math.round(temple.load * 100)}% load`,
        ctx.tick,
      ),
    );
  }

  if (ctx.waitingSeconds > 600) {
    alerts.push(
      mkAlert(
        "Warning",
        "Waiting time above threshold",
        `Darshan queue wait estimated at ${Math.floor(ctx.waitingSeconds / 60)}m ${ctx.waitingSeconds % 60}s`,
        ctx.tick,
      ),
    );
  } else if (ctx.waitingSeconds > 300) {
    alerts.push(
      mkAlert(
        "Info",
        "Elevated waiting times",
        `Average wait ${Math.floor(ctx.waitingSeconds / 60)}m — monitor queue throughput`,
        ctx.tick,
      ),
    );
  }

  for (const route of ctx.routeHealth) {
    if (route.status === "Blocked") {
      alerts.push(
        mkAlert(
          "Critical",
          "Route blocked",
          `${route.label} unavailable — redirect incoming devotees`,
          ctx.tick,
        ),
      );
    } else if (route.status === "Critical") {
      alerts.push(
        mkAlert(
          "Warning",
          `${route.label} critically congested`,
          `Health score ${route.healthScore}/100 · ${route.loadPercent}% load`,
          ctx.tick,
        ),
      );
    }
  }

  const medical = ctx.locations.find((l) => l.id === "MedicalCenter");
  if (medical && medical.load >= 0.75) {
    alerts.push(
      mkAlert(
        "Warning",
        "Medical Center overloaded",
        `${medical.count} agents · ${Math.round(medical.load * 100)}% capacity`,
        ctx.tick,
      ),
    );
  }

  for (const ev of ctx.activeEvents) {
    if (ev.type === "VIP Movement") {
      alerts.push(
        mkAlert(
          "Info",
          "VIP movement detected",
          "Express corridor prioritized · adjust gate staffing",
          ctx.tick,
        ),
      );
    }
    if (ev.type === "Fire") {
      alerts.push(
        mkAlert(
          "Critical",
          "Fire incident active",
          "Emergency evacuation protocols engaged · reroute all traffic",
          ctx.tick,
        ),
      );
    }
    if (ev.type === "Rain") {
      alerts.push(
        mkAlert(
          "Warning",
          "Rain conditions",
          "Reduced walking speeds · open covered waiting areas",
          ctx.tick,
        ),
      );
    }
    if (ev.type === "Medical Emergency") {
      alerts.push(
        mkAlert(
          "Critical",
          "Medical emergency in progress",
          "Temple access restricted · medical teams deployed",
          ctx.tick,
        ),
      );
    }
  }

  if (ctx.emergencyRouteActive) {
    alerts.push(
      mkAlert(
        "Warning",
        "Emergency route activated",
        "Dynamic rerouting in effect for active devotees",
        ctx.tick,
      ),
    );
  }

  if (ctx.reroutedCount > 0) {
    alerts.push(
      mkAlert(
        "Info",
        "Dynamic routing active",
        `${ctx.reroutedCount} devotees rerouted to optimal paths`,
        ctx.tick,
      ),
    );
  }

  if (alerts.length === 0) {
    alerts.push(
      mkAlert("Info", "All systems nominal", "No active crowd management alerts", ctx.tick),
    );
  }

  const severityOrder = { Critical: 0, Warning: 1, Info: 2 };
  return alerts
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 8);
}

export function resetAlertCounter(): void {
  alertCounter = 0;
}
