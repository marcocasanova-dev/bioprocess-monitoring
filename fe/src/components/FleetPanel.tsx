import type { MonipaInfo } from "../hooks/useFleet";
import { deriveStatus } from "../hooks/useSimulation";
import { THRESHOLD_COLOR, type ThresholdStatus } from "../hooks/useThreshold";
import { MonipaIcon } from "./MonipaIcon";

type Props = {
  fleet: MonipaInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
  // Only the selected device has a live trend value to compare against a
  // threshold — the others aren't polled for it, so this can't (and doesn't
  // try to) show every device's status at once.
  selectedThresholdStatus: ThresholdStatus;
};

const LED_COLOR = {
  offline: "#4a4d54",
  running: "#35d07f",
  paused: "#f5c518",
  idle: "#4c8dff",
} as const;

export function FleetPanel({ fleet, selectedId, onSelect, selectedThresholdStatus }: Props) {
  return (
    <nav className="fleet-panel">
      {fleet.map((m) => {
        const status = m.online ? deriveStatus(m) : null;
        const ledColor = m.online ? LED_COLOR[status!] : LED_COLOR.offline;
        const label = m.online ? (status === "running" ? "Running" : status === "paused" ? "Paused" : "Idle") : "Offline";
        const isSelected = m.id === selectedId;
        const thresholdStatus = isSelected ? selectedThresholdStatus : "unset";
        return (
          <button
            key={m.id}
            className={`fleet-chip ${isSelected ? "selected" : ""} ${m.online ? "" : "offline"}`}
            onClick={() => onSelect(m.id)}
          >
            <MonipaIcon ledColor={ledColor} dimmed={!m.online} pulse={status === "running"} />
            <span className="fleet-name">{m.name}</span>
            <span className="fleet-state">{label}</span>
            {thresholdStatus !== "unset" && (
              <span
                className="fleet-threshold-dot"
                title={`trend: ${thresholdStatus}`}
                style={{ background: THRESHOLD_COLOR[thresholdStatus] }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
