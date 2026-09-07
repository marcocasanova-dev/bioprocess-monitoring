import { useState } from "react";
import { ChartPanel } from "./components/ChartPanel";
import { DevicePanel } from "./components/DevicePanel";
import { FleetPanel } from "./components/FleetPanel";
import { TrendPanel } from "./components/TrendPanel";
import { useFleet } from "./hooks/useFleet";
import { useSpectrum } from "./hooks/useSpectrum";

// Amide I — the protein band. Just the opening view; clicking the spectrum
// picks any other wavenumber.
const DEFAULT_WAVENUMBER = 1650;

export function App() {
  const { fleet } = useFleet();
  const [selectedId, setSelectedId] = useState("monipa-01");
  const [wavenumber, setWavenumber] = useState(DEFAULT_WAVENUMBER);
  const selected = fleet.find((m) => m.id === selectedId) ?? null;
  const { spectrum, error } = useSpectrum(selectedId);
  const online = selected?.online ?? true;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bioprocess Monitoring</h1>
      </header>
      <FleetPanel fleet={fleet} selectedId={selectedId} onSelect={setSelectedId} />
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
        <DevicePanel key={selectedId} deviceId={selectedId} spectrum={spectrum} online={online} />
      </main>
      <div className="trend-row">
        <TrendPanel
          deviceId={selectedId}
          wavenumber={wavenumber}
          currentIndex={spectrum?.index ?? 0}
          online={online}
        />
      </div>
    </div>
  );
}
