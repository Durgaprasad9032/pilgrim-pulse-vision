"""
Crowd Simulator Module for Digital Twin Crowd Dynamics.

Simulates realistic, physics-inspired crowd movement across temple zones for different
operational scenarios (Normal Day, Weekend, Festival, Emergency).
"""

import logging
import math
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.models.enums import RiskLevel

logger = logging.getLogger(__name__)

# Base parameters per zone
ZONE_SPECS: Dict[str, Dict[str, Any]] = {
    "North Entry Gate": {
        "area": 400.0,
        "base_crowd": 1200,
        "base_queue": 120,
        "base_entry": 85,
        "base_exit": 35,
    },
    "Main Sanctum Courtyard": {
        "area": 250.0,
        "base_crowd": 1000,
        "base_queue": 350,
        "base_entry": 95,
        "base_exit": 90,
    },
    "South Exit Corridor": {
        "area": 350.0,
        "base_crowd": 800,
        "base_queue": 30,
        "base_entry": 20,
        "base_exit": 105,
    },
    "Parking Area": {
        "area": 2500.0,
        "base_crowd": 1500,
        "base_queue": 10,
        "base_entry": 50,
        "base_exit": 45,
    },
    "Food Court": {
        "area": 800.0,
        "base_crowd": 900,
        "base_queue": 70,
        "base_entry": 50,
        "base_exit": 45,
    },
    "VIP Entrance": {
        "area": 200.0,
        "base_crowd": 300,
        "base_queue": 15,
        "base_entry": 20,
        "base_exit": 18,
    },
}

SCENARIO_MULTIPLIERS: Dict[str, Dict[str, float]] = {
    "Normal Day": {"crowd": 1.0, "queue": 1.0, "flow": 1.0},
    "Weekend": {"crowd": 1.4, "queue": 1.35, "flow": 1.25},
    "Festival": {"crowd": 2.25, "queue": 2.2, "flow": 1.8},
    "Emergency": {"crowd": 2.8, "queue": 3.0, "flow": 2.2},
}


class ZoneState:
    """Class representing the real-time state of a single temple crowd zone."""

    def __init__(self, zone_name: str, spec: Dict[str, Any]):
        self.zone_name: str = zone_name
        self.area: float = spec["area"]
        self.crowd_count: int = spec["base_crowd"]
        self.queue_length: int = spec["base_queue"]
        self.entry_rate: int = spec["base_entry"]
        self.exit_rate: int = spec["base_exit"]
        self.density: float = round(self.crowd_count / self.area, 2)
        self.congestion: float = round(min(1.0, self.density / 4.5), 2)
        self.risk_level: RiskLevel = self._evaluate_risk(self.density)

    @staticmethod
    def _evaluate_risk(density: float) -> RiskLevel:
        if density < 1.5:
            return RiskLevel.LOW
        elif density < 3.0:
            return RiskLevel.MEDIUM
        elif density < 4.5:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    def update(
        self,
        scenario: str,
        tick: int,
        time_mult: float,
    ) -> Dict[str, Any]:
        """
        Updates zone metrics based on physical movement models and scenario multipliers.
        """
        mults = SCENARIO_MULTIPLIERS.get(
            scenario, SCENARIO_MULTIPLIERS["Normal Day"]
        )

        spec = ZONE_SPECS.get(self.zone_name, ZONE_SPECS["North Entry Gate"])
        base_crowd = spec["base_crowd"]
        base_queue = spec["base_queue"]
        base_entry = spec["base_entry"]
        base_exit = spec["base_exit"]

        # Micro fluctuation using sine wave and random Gaussian noise
        sine_var = math.sin(tick * 0.1) * 0.12
        noise = random.gauss(0, 0.04)
        fluctuation = 1.0 + sine_var + noise

        # Calculate new headcount
        raw_crowd = base_crowd * mults["crowd"] * time_mult * fluctuation
        if scenario == "Emergency" and "Sanctum" in self.zone_name:
            raw_crowd *= 1.35  # Severe overcrowding at Sanctum during emergency

        self.crowd_count = int(max(20, round(raw_crowd)))
        self.density = round(max(0.05, self.crowd_count / self.area), 2)

        # Calculate queue length
        queue_mult = mults["queue"] * (1.2 if scenario == "Emergency" else 1.0)
        self.queue_length = int(
            max(0, round(base_queue * queue_mult * fluctuation))
        )

        # Inflow / Outflow rates
        flow_mult = mults["flow"]
        if scenario == "Emergency" and "Exit" in self.zone_name:
            # Egress rush at exit corridors
            self.exit_rate = int(round(base_exit * flow_mult * 2.1))
            self.entry_rate = int(round(base_entry * 0.3))
        else:
            self.entry_rate = int(max(2, round(base_entry * flow_mult * (1.0 + noise))))
            self.exit_rate = int(max(2, round(base_exit * flow_mult * (1.0 + noise))))

        # Congestion index & Risk Level
        self.congestion = round(min(1.0, self.density / 4.5), 2)
        self.risk_level = self._evaluate_risk(self.density)

        return self.to_dict()

    def to_dict(self) -> Dict[str, Any]:
        """Returns dictionary representation of zone state."""
        return {
            "zone_name": self.zone_name,
            "crowd_count": self.crowd_count,
            "density": self.density,
            "queue_length": self.queue_length,
            "entry_rate": self.entry_rate,
            "exit_rate": self.exit_rate,
            "congestion": self.congestion,
            "risk_level": self.risk_level,
        }


class CrowdSimulator:
    """
    Real-Time Crowd Simulator managing state evolution for all temple digital twin zones.
    """

    def __init__(self, initial_scenario: str = "Normal Day"):
        self.scenario: str = initial_scenario
        self.tick: int = 0
        self.zones: Dict[str, ZoneState] = {
            name: ZoneState(name, spec) for name, spec in ZONE_SPECS.items()
        }
        logger.info(
            "CrowdSimulator initialized with scenario: %s across %d zones",
            self.scenario,
            len(self.zones),
        )

    def set_scenario(self, new_scenario: str) -> None:
        """Changes the current simulation scenario (Normal Day, Weekend, Festival, Emergency)."""
        if new_scenario in SCENARIO_MULTIPLIERS:
            logger.info("Simulation scenario changed from '%s' to '%s'", self.scenario, new_scenario)
            self.scenario = new_scenario
        else:
            logger.warning("Unknown scenario '%s'. Ignoring request.", new_scenario)

    def step(self) -> Dict[str, Any]:
        """
        Advances the simulation by 1 step (tick) and updates all zone states.

        Returns:
            Dict containing tick count, scenario, total active agents, and list of zone states.
        """
        self.tick += 1

        # Time of day profile (simulated hours)
        simulated_hour = (6 + (self.tick * 5 / 3600)) % 24  # 5 seconds per tick
        time_mult = 1.0 + 0.4 * math.sin(math.pi * (simulated_hour - 6) / 12)

        total_agents = 0
        zone_results: List[Dict[str, Any]] = []

        for zone in self.zones.values():
            z_data = zone.update(self.scenario, self.tick, time_mult)
            total_agents += zone.crowd_count
            zone_results.append(z_data)

        # Overall congestion index
        avg_density = sum(z.density for z in self.zones.values()) / len(self.zones)
        overall_congestion = round(min(100.0, (avg_density / 4.0) * 100), 1)

        return {
            "tick": self.tick,
            "scenario": self.scenario,
            "active_agents": total_agents,
            "congestion_index": overall_congestion,
            "timestamp": datetime.now(timezone.utc),
            "zones": zone_results,
        }
