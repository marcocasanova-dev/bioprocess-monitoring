"""
Generates data/monipa-0N.csv for each device in the fleet, by taking the
original single-device spectra.csv and applying a small per-device
scale/offset/noise so each Monipa reads slightly differently — enough to
tell them apart on an overlay chart, not so much it looks broken against
the app's fixed y-axis range.

Run once from the project root: python scripts/generate_fleet_data.py
"""

import numpy as np
import pandas as pd
from pathlib import Path

SEED = 42
DATA_DIR = Path(__file__).parent.parent / "data"
SOURCE_CSV = DATA_DIR / "spectra.csv"

# id, display name, online, scale, offset, noise-stddev
DEVICES = [
    ("monipa-01", "Monipa 01", True, 1.00, 0.0000, 0.0005),
    ("monipa-02", "Monipa 02", True, 1.03, 0.0010, 0.0006),
    ("monipa-03", "Monipa 03", True, 0.97, -0.0008, 0.0006),
    ("monipa-04", "Monipa 04", True, 1.01, 0.0004, 0.0005),
    ("monipa-05", "Monipa 05", False, 0.98, -0.0005, 0.0005),
    ("monipa-06", "Monipa 06", False, 1.04, 0.0012, 0.0007),
]


def main():
    base = pd.read_csv(SOURCE_CSV, index_col=0)
    base.columns = base.columns.astype(int)

    for i, (device_id, name, online, scale, offset, noise_std) in enumerate(DEVICES):
        rng = np.random.default_rng(SEED + i)
        noise = rng.normal(0, noise_std, size=base.shape)
        variant = base * scale + offset + noise
        out_path = DATA_DIR / f"{device_id}.csv"
        variant.to_csv(out_path)
        print(f"wrote {out_path.name} ({name}, online={online})")


if __name__ == "__main__":
    main()
