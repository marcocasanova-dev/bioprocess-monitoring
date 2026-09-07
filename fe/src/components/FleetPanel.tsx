import type { MonipaInfo } from "../hooks/useFleet";
import { deriveStatus } from "../hooks/useSimulation";
import { MonipaIcon } from "./MonipaIcon";

type Props = {
  fleet: MonipaInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const LED_COLOR = {
  offline: "#4a4d54",
  running: "#35d07f",
  paused: "#f5c518",
  idle: "#4c8dff",
} as const;

export function FleetPanel({ fleet, selectedId, onSelect }: Props) {
  return (
    <nav className="fleet-panel">
      {fleet.map((m) => {
        const status = m.online ? deriveStatus(m) : null;
        const ledColor = m.online ? LED_COLOR[status!] : LED_COLOR.offline;
        const label = m.online ? (status === "running" ? "Running" : status === "paused" ? "Paused" : "Idle") : "Offline";
        return (
          <button
            key={m.id}
            className={`fleet-chip ${m.id === selectedId ? "selected" : ""} ${m.online ? "" : "offline"}`}
            onClick={() => onSelect(m.id)}
          >
            <MonipaIcon ledColor={ledColor} dimmed={!m.online} pulse={status === "running"} />
            <span className="fleet-name">{m.name}</span>
            <span className="fleet-state">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
