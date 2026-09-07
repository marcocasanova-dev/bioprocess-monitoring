import { useEffect, useState } from "react";
import { client } from "../client";
import type { components } from "../api-types";

export type MonipaSpectrum = components["schemas"]["MonipaSpectrum"];

/**
 * Polls GET /monipas/spectrum — every ONLINE device's current spectrum, for
 * an overlay/comparison chart. Only polls while `enabled` is true, so
 * switching to single-device view stops the extra requests.
 */
export function useFleetSpectrum(enabled: boolean, pollMs = 700) {
  const [spectra, setSpectra] = useState<MonipaSpectrum[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function fetchAll() {
      const { data, error } = await client.GET("/monipas/spectrum");
      if (cancelled) return;
      if (error || !data) {
        setError("Failed to load fleet spectra");
        return;
      }
      setError(null);
      setSpectra(data);
    }

    fetchAll();
    const id = setInterval(fetchAll, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, pollMs]);

  return { spectra, error };
}
