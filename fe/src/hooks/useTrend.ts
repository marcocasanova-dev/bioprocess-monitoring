import { useEffect, useState } from "react";
import { client } from "../client";
import type { components } from "../api-types";

export type TrendResponse = components["schemas"]["TrendResponse"];

/**
 * Fetches one wavenumber's absorbance across the whole run.
 *
 * Unlike useSpectrum this doesn't poll: the CSV behind a device never changes,
 * so the curve is fetched once per (device, wavenumber) and the live position
 * on it comes from the spectrum poll instead.
 */
export function useTrend(deviceId: string, wavenumber: number) {
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTrend(null); // clear the previous device's/wavenumber's curve

    async function fetchTrend() {
      const { data, error } = await client.GET("/monipas/{monipa_id}/trend/{wavenumber}", {
        params: { path: { monipa_id: deviceId, wavenumber } },
      });
      if (cancelled) return;
      if (error || !data) {
        setError("Failed to load trend data");
        return;
      }
      setError(null);
      setTrend(data);
    }

    fetchTrend();
    return () => {
      cancelled = true;
    };
  }, [deviceId, wavenumber]);

  return { trend, error };
}
