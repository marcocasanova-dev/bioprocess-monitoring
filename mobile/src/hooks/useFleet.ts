import { useEffect, useState } from "react";
import { client } from "../client";
import type { components } from "../api-types";

export type MonipaInfo = components["schemas"]["MonipaInfo"];

/** Polls GET /monipas — the fleet's status (online/offline, running, index). */
export function useFleet(pollMs = 2000) {
  const [fleet, setFleet] = useState<MonipaInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFleet() {
      try {
        const { data, error } = await client.GET("/monipas");
        if (cancelled) return;
        if (error || !data) {
          setError("Failed to load the Monipa fleet");
          return;
        }
        setError(null);
        setFleet(data);
      } catch {
        if (!cancelled) setError("Could not reach the device. Is the backend running?");
      }
    }

    fetchFleet();
    const id = setInterval(fetchFleet, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { fleet, error };
}
