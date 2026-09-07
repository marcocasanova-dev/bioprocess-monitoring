import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { MonipaDevice } from "./MonipaDevice";
import { deriveStatus, useSimulationActions, type SimStatus } from "../hooks/useSimulation";
import type { SpectrumResponse } from "../hooks/useSpectrum";

const STATUS_LABEL: Record<SimStatus, string> = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
};

type Props = {
  deviceId: string;
  spectrum: SpectrumResponse | null;
  online: boolean;
};

export function DevicePanel({ deviceId, spectrum, online }: Props) {
  const status = deriveStatus(spectrum);
  const { busy, error, start, pause, stop } = useSimulationActions(deviceId);

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
            <MonipaDevice status={online ? status : "idle"} />
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
    </section>
  );
}
