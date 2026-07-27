"""
Synthetic Crowd Dataset Generator script.

Generates realistic historical crowd data for Pilgrim Pulse Vision AI crowd prediction models.
"""

from pathlib import Path
import numpy as np
import pandas as pd

# Target output CSV path
OUTPUT_DIR = Path(__file__).parent / "datasets"
OUTPUT_FILE = OUTPUT_DIR / "crowd_dataset.csv"

# Configuration for realistic generation
ZONES = [
    {"name": "North Entry Gate", "area": 400.0, "base_crowd": 1200, "bottleneck": 0.35},
    {"name": "Main Sanctum", "area": 250.0, "base_crowd": 1000, "bottleneck": 0.50},
    {"name": "South Exit", "area": 350.0, "base_crowd": 800, "bottleneck": 0.08},
    {"name": "Parking Area", "area": 2500.0, "base_crowd": 1500, "bottleneck": 0.02},
    {"name": "Food Court", "area": 800.0, "base_crowd": 900, "bottleneck": 0.20},
    {"name": "VIP Entrance", "area": 200.0, "base_crowd": 300, "bottleneck": 0.12},
]

# Random seed for reproducibility
np.random.seed(42)


def generate_synthetic_crowd_data(num_days: int = 18) -> pd.DataFrame:
    """
    Generates approximately 5,000 realistic crowd records over consecutive 30-minute intervals.
    """
    # 18 days * 48 intervals/day * 6 zones = 5,184 records
    start_time = pd.Timestamp("2026-06-01 00:00:00")
    timestamps = pd.date_range(start=start_time, periods=num_days * 48, freq="30min")

    records = []

    # Assign festival days randomly (approx ~22% of days)
    unique_dates = timestamps.normalize().unique()
    festival_dates = set(
        np.random.choice(
            unique_dates, size=int(len(unique_dates) * 0.22), replace=False
        )
    )

    # Pre-generate environmental conditions per timestamp for smooth realistic curves
    temp_base = 28.0 + 8.0 * np.sin(
        np.pi * (timestamps.hour * 60 + timestamps.minute - 360) / 720
    )
    temp_noise = np.random.normal(0, 1.2, size=len(timestamps))
    temperatures = np.round(np.clip(temp_base + temp_noise, 18.0, 42.0), 1)

    humidity_base = 80.0 - 0.75 * (temperatures - 20.0) * 4
    humidity_noise = np.random.normal(0, 3.0, size=len(timestamps))
    humidities = np.round(np.clip(humidity_base + humidity_noise, 30.0, 95.0), 1)

    for i, ts in enumerate(timestamps):
        date_norm = ts.normalize()
        is_festival = 1 if date_norm in festival_dates else 0
        is_weekend = 1 if ts.weekday() in (5, 6) else 0

        # Time-of-day crowd multiplier profile
        hour = ts.hour + ts.minute / 60.0
        if 5.0 <= hour < 12.0:
            time_mult = 1.3 + 0.7 * np.sin(np.pi * (hour - 5.0) / 7.0)
        elif 12.0 <= hour < 16.0:
            time_mult = 1.0 + 0.2 * np.sin(np.pi * (hour - 12.0) / 4.0)
        elif 16.0 <= hour < 22.0:
            time_mult = 1.4 + 0.8 * np.sin(np.pi * (hour - 16.0) / 6.0)
        else:
            time_mult = 0.15 + 0.15 * np.cos(np.pi * hour / 6.0)

        fest_mult = 2.1 if is_festival else 1.0
        wknd_mult = 1.45 if is_weekend else 1.0

        temp = temperatures[i]
        hum = humidities[i]

        for zone in ZONES:
            zone_name = zone["name"]
            area = zone["area"]
            base = zone["base_crowd"]
            bottleneck = zone["bottleneck"]

            zone_time_mult = time_mult
            if zone_name == "Food Court":
                if 12.0 <= hour <= 14.5 or 19.0 <= hour <= 21.5:
                    zone_time_mult *= 1.8
                else:
                    zone_time_mult *= 0.6

            expected_crowd = base * zone_time_mult * fest_mult * wknd_mult
            noise_factor = np.random.normal(1.0, 0.08)
            crowd_count = int(max(10, round(expected_crowd * noise_factor)))

            density = round(crowd_count / area, 2)

            expected_queue = crowd_count * bottleneck * (1.2 if is_festival else 1.0)
            queue_noise = np.random.normal(0, max(2, expected_queue * 0.1))
            queue_length = int(max(0, round(expected_queue + queue_noise)))

            if zone_name == "North Entry Gate":
                entry_rate = int(max(5, round(crowd_count * 0.12 * np.random.uniform(0.9, 1.1))))
                exit_rate = int(max(2, round(entry_rate * 0.4 * np.random.uniform(0.8, 1.2))))
            elif zone_name == "South Exit":
                exit_rate = int(max(5, round(crowd_count * 0.14 * np.random.uniform(0.9, 1.1))))
                entry_rate = int(max(1, round(exit_rate * 0.2 * np.random.uniform(0.8, 1.2))))
            else:
                entry_rate = int(max(2, round(crowd_count * 0.05 * np.random.uniform(0.8, 1.2))))
                exit_rate = int(max(2, round(crowd_count * 0.05 * np.random.uniform(0.8, 1.2))))

            if density < 1.5:
                risk_level = "LOW"
            elif density < 3.0:
                risk_level = "MODERATE"
            elif density < 4.5:
                risk_level = "HIGH"
            else:
                risk_level = "CRITICAL"

            records.append({
                "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "zone_name": zone_name,
                "crowd_count": crowd_count,
                "density_per_m2": density,
                "temperature": temp,
                "humidity": hum,
                "festival_day": is_festival,
                "weekend": is_weekend,
                "queue_length": queue_length,
                "entry_rate": entry_rate,
                "exit_rate": exit_rate,
                "risk_level": risk_level,
                "target_next_density": 0.0,
            })

    df = pd.DataFrame(records)

    df = df.sort_values(by=["zone_name", "timestamp"]).reset_index(drop=True)
    df["target_next_density"] = df.groupby("zone_name")["density_per_m2"].shift(-1)

    missing_mask = df["target_next_density"].isna()
    df.loc[missing_mask, "target_next_density"] = np.round(
        np.clip(
            df.loc[missing_mask, "density_per_m2"]
            * np.random.uniform(0.95, 1.05, size=missing_mask.sum()),
            0.0,
            10.0,
        ),
        2,
    )

    df = df.sort_values(by=["timestamp", "zone_name"]).reset_index(drop=True)
    return df


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Generating synthetic crowd dataset...")
    dataset_df = generate_synthetic_crowd_data(num_days=18)
    dataset_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Successfully saved dataset with {len(dataset_df)} rows to '{OUTPUT_FILE.resolve()}'")
