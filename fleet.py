from dataclasses import dataclass, field

from biospectrometer import Biospectrometer, read_csv_file

# id, display name, online. 4 online + 2 offline, per data/monipa-0N.csv
# (see scripts/generate_fleet_data.py for how those were generated).
DEVICE_SEED = [
    ("monipa-01", "Monipa 01", True),
    ("monipa-02", "Monipa 02", True),
    ("monipa-03", "Monipa 03", True),
    ("monipa-04", "Monipa 04", True),
    ("monipa-05", "Monipa 05", False),
    ("monipa-06", "Monipa 06", False),
]


@dataclass
class Monipa:
    id: str
    name: str
    online: bool
    spectrometer: Biospectrometer = field(repr=False)


def build_fleet() -> dict[str, Monipa]:
    """One Biospectrometer per device, keyed by id, seeded from its own CSV."""
    return {
        device_id: Monipa(id=device_id, name=name, online=online, spectrometer=Biospectrometer(read_csv_file(device_id)))
        for device_id, name, online in DEVICE_SEED
    }
