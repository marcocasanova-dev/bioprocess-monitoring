import { useEffect, useState } from "react";
import { client } from "../client";
import type { components } from "../api-types";

export type SpectrumResponse = components["schemas"]["SpectrumResponse"];

/** Polls GET /monipas/{deviceId}/spectrum on an interval. */
export function useSpectrum(deviceId: string, pollMs = 500) {
  const [spectrum, setSpectrum] = useState<SpectrumResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSpectrum(null); // clear stale data from the previously selected device

    async function fetchSpectrum() {
      try {
        const { data, error } = await client.GET("/monipas/{monipa_id}/spectrum", {
          params: { path: { monipa_id: deviceId } },
        });
        if (cancelled) return;
        if (error || !data) {
          setError("Failed to load spectrum data");
          return;
        }
        setError(null);
        setSpectrum(data);
      } catch {
        if (!cancelled) setError("Could not reach the device. Is the backend running?");
      }
    }

    fetchSpectrum();
    const id = setInterval(fetchSpectrum, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [deviceId, pollMs]);

  return { spectrum, error };
}
