import { useEffect, useState } from "react";
import { client } from "../client";
import type { components } from "../api-types";

export type HeatmapResponse = components["schemas"]["HeatmapResponse"];

/**
 * Fetches the whole run as a grid (readings × wavenumbers).
 *
 * Only runs when `enabled` — it's the heaviest payload in the app (~220 KB even
 * thinned), and there's no reason to pay for it while the user is looking at a
 * different view. Like useTrend it doesn't poll: the CSV is fixed.
 */
export function useHeatmap(deviceId: string, enabled: boolean) {
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setHeatmap(null);

    async function fetchHeatmap() {
      const { data, error } = await client.GET("/monipas/{monipa_id}/heatmap", {
        params: { path: { monipa_id: deviceId } },
      });
      if (cancelled) return;
      if (error || !data) {
        setError("Failed to load the full run");
        return;
      }
      setError(null);
      setHeatmap(data);
    }

    fetchHeatmap();
    return () => {
      cancelled = true;
    };
  }, [deviceId, enabled]);

  return { heatmap, error };
}
