import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { MonipaDevice } from "./MonipaDevice";
import { DiagnosticsModal } from "./DiagnosticsModal";
import { deriveStatus, useSimulationActions, type SimStatus } from "../hooks/useSimulation";
import type { SpectrumResponse } from "../hooks/useSpectrum";
import type { ThresholdStatus } from "../hooks/useThreshold";

const STATUS_LABEL: Record<SimStatus, string> = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
};

type Props = {
  deviceId: string;
  spectrum: SpectrumResponse | null;
  online: boolean;
  thresholdStatus: ThresholdStatus;
};

export function DevicePanel({ deviceId, spectrum, online, thresholdStatus }: Props) {
  const status = deriveStatus(spectrum);
  const { busy, error, start, pause, stop } = useSimulationActions(deviceId);
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [showTrafficLight, setShowTrafficLight] = useState(false);
  const [showInternals, setShowInternals] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  return (
    <section className="panel device-panel">
      <header className="panel-header">
        <h2>Monipa Device</h2>
        <span className={`status-pill ${online ? `status-${status}` : "status-offline"}`}>
          {online ? STATUS_LABEL[status] : "Offline"}
        </span>
      </header>

      <div className="canvas-wrap">
        <Canvas camera={{ position: [2.6, 1.8, 3.2], fov: 40 }} shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 5, 4]} intensity={1.4} castShadow />
            <directionalLight position={[-3, 2, -2]} intensity={0.4} />
            <MonipaDevice
              status={online ? status : "idle"}
              showTrafficLight={showTrafficLight}
              thresholdStatus={thresholdStatus}
              transparent={showInternals}
            />
            <ContactShadows position={[0, -0.96, 0]} opacity={0.45} scale={6} blur={2.4} far={2} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={2.2}
            maxDistance={5.5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.7}
            autoRotate={status !== "running"}
            autoRotateSpeed={0.8}
            enableDamping
          />
        </Canvas>
        <p className="canvas-hint">Drag to rotate · scroll to zoom</p>
      </div>

      {!online && <p className="panel-error">This Monipa is offline — no control available.</p>}
      {online && error && <p className="panel-error">{error}</p>}

      <div className="addons">
        <label className="addons-toggle">
          <input type="checkbox" checked={addonsOpen} onChange={(e) => setAddonsOpen(e.target.checked)} />
          <span>Addons</span>
        </label>
        {addonsOpen && (
          <div className="addons-options">
            <label className="addons-option">
              <input
                type="checkbox"
                checked={showTrafficLight}
                onChange={(e) => setShowTrafficLight(e.target.checked)}
              />
              <span>Show threshold traffic light</span>
            </label>
            <label className="addons-option">
              <input type="checkbox" checked={showInternals} onChange={(e) => setShowInternals(e.target.checked)} />
              <span>See inside (transparent housing)</span>
            </label>
            <button className="btn btn-diagnostics" onClick={() => setDiagnosticsOpen(true)}>
              Run diagnostics
            </button>
          </div>
        )}
      </div>

      <div className="controls">
        <button className="btn btn-start" disabled={!online || busy || status === "running"} onClick={start}>
          ▶ Start
        </button>
        <button className="btn btn-pause" disabled={!online || busy || status !== "running"} onClick={pause}>
          ❚❚ Pause
        </button>
        <button className="btn btn-stop" disabled={!online || busy || status === "idle"} onClick={stop}>
          ■ Stop
        </button>
      </div>

      {diagnosticsOpen && (
        <DiagnosticsModal
          deviceId={deviceId}
          status={status}
          online={online}
          spectrum={spectrum}
          thresholdStatus={thresholdStatus}
          onClose={() => setDiagnosticsOpen(false)}
        />
      )}
    </section>
  );
}
