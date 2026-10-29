import { useCallback, useEffect, useRef, useState } from "react";
import { ChartPanel } from "./components/ChartPanel";
import { DevicePanel } from "./components/DevicePanel";
import { FleetPanel } from "./components/FleetPanel";
import { TrendPanel } from "./components/TrendPanel";
import { useFleet } from "./hooks/useFleet";
import { useSpectrum } from "./hooks/useSpectrum";
import { useDebugLog } from "./hooks/useDebugLog";
import type { ThresholdStatus } from "./hooks/useThreshold";

// Amide I — the protein band. Just the opening view; clicking the spectrum
// picks any other wavenumber.
const DEFAULT_WAVENUMBER = 1650;

export function App() {
  const { fleet } = useFleet();
  const [selectedId, setSelectedId] = useState("monipa-01");
  const [wavenumber, setWavenumber] = useState(DEFAULT_WAVENUMBER);
  const [thresholdStatus, setThresholdStatus] = useState<ThresholdStatus>("unset");
  const selected = fleet.find((m) => m.id === selectedId) ?? null;
  const { spectrum, error } = useSpectrum(selectedId);
  const online = selected?.online ?? true;
  const debugLog = useDebugLog();

  // Stable identity so TrendPanel's effect that reports status doesn't
  // re-fire on every App render.
  const handleThresholdStatus = useCallback((status: ThresholdStatus) => setThresholdStatus(status), []);

  // Logs a polling/connectivity failure the moment useSpectrum's fetch
  // starts failing — a hardware-adjacent signal (the device stopped
  // responding), distinct from a threshold crossing (a data signal).
  const prevPollErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== prevPollErrorRef.current) {
      debugLog.logEvent("error", "hardware", `${selectedId}: ${error}`);
    }
    prevPollErrorRef.current = error;
  }, [error, selectedId, debugLog]);

  // Logs a threshold crossing as a data event — only on the transition into
  // below/above, not every render while it stays there, so pausing on a bad
  // reading doesn't spam the log once per poll.
  const prevThresholdRef = useRef<ThresholdStatus>("unset");
  useEffect(() => {
    if (thresholdStatus !== prevThresholdRef.current && (thresholdStatus === "below" || thresholdStatus === "above")) {
      debugLog.logEvent(
        "warn",
        "data",
        `${selectedId}: reading went ${thresholdStatus === "below" ? "below the minimum" : "above the maximum"}`,
      );
    }
    prevThresholdRef.current = thresholdStatus;
  }, [thresholdStatus, selectedId, debugLog]);

  // A device switch starts the log clean — events from a different device's
  // run aren't relevant once you've moved on to another one.
  useEffect(() => {
    debugLog.clear();
    prevPollErrorRef.current = null;
    prevThresholdRef.current = "unset";
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately only on selectedId change, not on debugLog identity
  }, [selectedId]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bioprocess Monitoring</h1>
      </header>
      <FleetPanel
        fleet={fleet}
        selectedId={selectedId}
        onSelect={setSelectedId}
        selectedThresholdStatus={thresholdStatus}
      />
      <main className="split">
        <ChartPanel
          deviceId={selectedId}
          deviceName={selected?.name ?? selectedId}
          spectrum={spectrum}
          error={error}
          online={online}
          selectedWavenumber={wavenumber}
          onSelectWavenumber={setWavenumber}
        />
        <DevicePanel
          key={selectedId}
          deviceId={selectedId}
          spectrum={spectrum}
          online={online}
          thresholdStatus={thresholdStatus}
          debugEvents={debugLog.events}
          onClearDebugLog={debugLog.clear}
        />
      </main>
      <div className="trend-row">
        <TrendPanel
          deviceId={selectedId}
          wavenumber={wavenumber}
          currentIndex={spectrum?.index ?? 0}
          online={online}
          onStatusChange={handleThresholdStatus}
        />
      </div>
    </div>
  );
}
