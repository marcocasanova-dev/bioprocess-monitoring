import { useCallback, useState } from "react";

export type DebugLevel = "info" | "warn" | "error";
export type DebugCategory = "hardware" | "software" | "data";

export type DebugEvent = {
  id: number;
  time: string;
  level: DebugLevel;
  category: DebugCategory;
  message: string;
};

let nextId = 1;

/**
 * A running, in-memory log of events observed while a device is being
 * watched — distinct from DiagnosticsModal's one-shot snapshot: this
 * accumulates over time instead of answering "is it okay right now".
 * Not persisted; a page refresh or device switch starts clean.
 */
export function useDebugLog() {
  const [events, setEvents] = useState<DebugEvent[]>([]);

  const logEvent = useCallback((level: DebugLevel, category: DebugCategory, message: string) => {
    setEvents((prev) => {
      // Guards against React StrictMode's double-invoke of effects in dev
      // (mount → cleanup → remount) re-firing the same "just crossed" event
      // twice back to back — collapses it to one entry instead of two.
      if (prev[0] && prev[0].level === level && prev[0].category === category && prev[0].message === message) {
        return prev;
      }
      return [{ id: nextId++, time: new Date().toLocaleTimeString(), level, category, message }, ...prev];
    });
  }, []);

  const clear = useCallback(() => setEvents([]), []);

  return { events, logEvent, clear };
}
