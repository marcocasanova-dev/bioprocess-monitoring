import { useEffect, useMemo, useState } from "react";
import type { SimStatus } from "../hooks/useSimulation";
import type { ThresholdStatus } from "../hooks/useThreshold";
import type { SpectrumResponse } from "../hooks/useSpectrum";

type LogLevel = "ok" | "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  message: string;
};

type LogSection = {
  title: string;
  entries: LogEntry[];
};

type Props = {
  deviceId: string;
  status: SimStatus;
  online: boolean;
  spectrum: SpectrumResponse | null;
  thresholdStatus: ThresholdStatus;
  onClose: () => void;
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  ok: "OK",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

/**
 * Builds a plausible one-shot diagnostic readout from state already on hand
 * (connectivity, sim status, current reading, threshold) — this is a
 * synthetic self-check for the simulated fleet, not a real hardware probe.
 */
function buildSections(props: Omit<Props, "onClose">): LogSection[] {
  const { deviceId, status, online, spectrum, thresholdStatus } = props;
  const now = new Date().toLocaleTimeString();

  const connectivity: LogEntry[] = online
    ? [
        { level: "ok", message: `${deviceId} responded to ping` },
        { level: "ok", message: "REST endpoint /spectrum reachable" },
        { level: "info", message: `Last poll at ${now}` },
      ]
    : [
        { level: "error", message: `${deviceId} did not respond — device offline` },
        { level: "warn", message: "Falling back to last known reading" },
      ];

  const power: LogEntry[] = [
    { level: online ? "ok" : "warn", message: online ? "Power rail nominal (5V/3.3V)" : "Power rail unknown — no telemetry" },
    { level: "ok", message: "Battery pack: charge holding steady" },
  ];

  const controller: LogEntry[] = [
    { level: "ok", message: "Arduino heartbeat received" },
    {
      level: status === "running" ? "ok" : "info",
      message: `Simulation state: ${status}`,
    },
    status === "paused"
      ? { level: "warn", message: "Pump idle while paused — no flow" }
      : { level: "ok", message: "Pump/rotor control loop nominal" },
  ];

  const optics: LogEntry[] = spectrum
    ? [
        { level: "ok", message: "Spectrometer module reporting data" },
        { level: "info", message: `Reading #${spectrum.index} of current run` },
        { level: "info", message: `${spectrum.wavenumbers.length} wavenumber points in last scan` },
      ]
    : [{ level: "warn", message: "No spectrum data received yet" }];

  const process: LogEntry[] =
    thresholdStatus === "unset"
      ? [{ level: "info", message: "No min/max range set — threshold monitoring inactive" }]
      : thresholdStatus === "in-range"
        ? [{ level: "ok", message: "Current reading within user-defined range" }]
        : [
            {
              level: "warn",
              message:
                thresholdStatus === "below"
                  ? "Current reading below the configured minimum"
                  : "Current reading above the configured maximum",
            },
          ];

  return [
    { title: "Connectivity", entries: connectivity },
    { title: "Power", entries: power },
    { title: "Controller (Arduino)", entries: controller },
    { title: "Optics (Spectrometer)", entries: optics },
    { title: "Process / Threshold", entries: process },
  ];
}

export function DiagnosticsModal({ deviceId, status, online, spectrum, thresholdStatus, onClose }: Props) {
  const [running, setRunning] = useState(true);
  const sections = useMemo(
    () => buildSections({ deviceId, status, online, spectrum, thresholdStatus }),
    [deviceId, status, online, spectrum, thresholdStatus],
  );

  useEffect(() => {
    const timer = setTimeout(() => setRunning(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal diagnostics-modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>Diagnostics — {deviceId}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {running ? (
          <p className="diagnostics-running">Running checks…</p>
        ) : (
          <div className="diagnostics-body">
            {sections.map((section) => (
              <div key={section.title} className="diagnostics-section">
                <h3>{section.title}</h3>
                <ul className="diagnostics-log">
                  {section.entries.map((entry, i) => (
                    <li key={i} className={`log-entry log-${entry.level}`}>
                      <span className="log-level">{LEVEL_LABEL[entry.level]}</span>
                      <span className="log-message">{entry.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
