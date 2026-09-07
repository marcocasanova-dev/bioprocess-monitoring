import { useCallback, useState } from "react";
import { client } from "../client";

export type SimStatus = "idle" | "running" | "paused";

/**
 * Derives UI status from the backend's own `running` flag (polled via
 * /monipas/{id}/spectrum or /monipas) instead of tracking it client-side —
 * so the app reflects reality even if the simulation was started/stopped
 * from elsewhere (curl, the web app, another device) before this app ever
 * loaded.
 *
 * The API only reports running/not-running, not a separate "paused" state,
 * so paused-vs-idle is inferred from whether stop left the index at 0:
 * Stop always jumps back to 0, Pause never touches the index.
 */
export function deriveStatus(state: { running: boolean; index: number } | null): SimStatus {
  if (!state) return "idle";
  if (state.running) return "running";
  return state.index === 0 ? "idle" : "paused";
}

/**
 * Start/pause/stop actions against one device's simulation.
 *
 * The API only exposes a start/stop toggle, so "pause" and "stop" are both
 * built on POST /monipas/{id}/stop:
 *  - pause freezes the simulation in place (start resumes from here)
 *  - stop freezes it and jumps back to index 0 (start begins from the top)
 *
 * These just fire the request; the resulting status is picked up on the
 * next poll (see deriveStatus above), not set optimistically here.
 */
export function useSimulationActions(deviceId: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { error } = await client.POST("/monipas/{monipa_id}/start", { params: { path: { monipa_id: deviceId } } });
      if (error) throw new Error("Backend rejected start");
    } catch {
      setError("Could not reach the device. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }, [deviceId]);

  const pause = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { error } = await client.POST("/monipas/{monipa_id}/stop", { params: { path: { monipa_id: deviceId } } });
      if (error) throw new Error("Backend rejected stop");
    } catch {
      setError("Could not reach the device. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }, [deviceId]);

  const stop = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { error: stopError } = await client.POST("/monipas/{monipa_id}/stop", {
        params: { path: { monipa_id: deviceId } },
      });
      if (stopError) throw new Error("Backend rejected stop");
      const { error: jumpError } = await client.POST("/monipas/{monipa_id}/jump/{index}", {
        params: { path: { monipa_id: deviceId, index: 0 } },
      });
      if (jumpError) throw new Error("Backend rejected jump");
    } catch {
      setError("Could not reach the device. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }, [deviceId]);

  return { busy, error, start, pause, stop };
}
