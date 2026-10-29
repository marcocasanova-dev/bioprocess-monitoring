import type { DebugEvent } from "../hooks/useDebugLog";

type Props = {
  events: DebugEvent[];
  onClear: () => void;
};

const CATEGORY_LABEL: Record<DebugEvent["category"], string> = {
  hardware: "HW",
  software: "SW",
  data: "DATA",
};

/**
 * A running list of events observed while this device has been watched —
 * dropped polls, connectivity loss, threshold crossings — as opposed to
 * DiagnosticsModal's one-shot "is it okay right now" snapshot. Empty until
 * something actually happens; it's not a heartbeat feed.
 */
export function DebugLogPanel({ events, onClear }: Props) {
  return (
    <div className="debug-log">
      <div className="debug-log-header">
        <span className="debug-log-count">{events.length === 0 ? "No events yet" : `${events.length} event(s)`}</span>
        <button className="btn btn-clear-log" onClick={onClear} disabled={events.length === 0}>
          Clear
        </button>
      </div>
      {events.length === 0 ? (
        <p className="debug-log-empty">Connectivity drops and threshold crossings will show up here as they happen.</p>
      ) : (
        <ul className="debug-log-list">
          {events.map((event) => (
            <li key={event.id} className={`log-entry log-${event.level}`}>
              <span className="log-time">{event.time}</span>
              <span className="debug-log-category">{CATEGORY_LABEL[event.category]}</span>
              <span className="log-message">{event.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
