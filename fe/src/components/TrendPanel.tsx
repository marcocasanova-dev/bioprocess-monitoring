import { useEffect, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";
import { useTrend } from "../hooks/useTrend";
import { useSimulationActions } from "../hooks/useSimulation";
import { getThresholdStatus, THRESHOLD_COLOR, type ThresholdStatus } from "../hooks/useThreshold";

type Props = {
  deviceId: string;
  wavenumber: number;
  currentIndex: number;
  online: boolean;
  onStatusChange: (status: ThresholdStatus) => void;
};

const BASE_LAYOUT = {
  margin: { t: 16, r: 24, b: 40, l: 56 },
  xaxis: { title: { text: "Reading #" } },
  // Same fixed range as the spectrum chart, deliberately: autoscaling per
  // wavenumber zooms into the noise of a flat region and draws it as if it
  // were a real signal. Shared scale keeps "this peak grows" and "this one
  // doesn't" comparable at a glance.
  yaxis: { title: { text: "Absorbance [mAU]" }, range: [-0.002, 0.09] },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { color: "#c8ccd4" },
  showlegend: false,
};

// Parses a text input into a finite number, or null for "no limit on this side".
function parseBound(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function TrendPanel({ deviceId, wavenumber, currentIndex, online, onStatusChange }: Props) {
  const { trend, error } = useTrend(deviceId, wavenumber);
  const { jump } = useSimulationActions(deviceId);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const plotted = useRef(false);
  // While dragging, follow the slider rather than the 500ms poll — otherwise
  // the two fight each other and the handle jumps back under the cursor.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const shownIndex = dragIndex ?? currentIndex;

  // Raw absorbance bounds, typed by the user — not a calibrated concentration.
  // Both start empty (no alarm) so the feature is opt-in, not a claim the
  // system already knows what "correct" looks like for this run.
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const min = parseBound(minInput);
  const max = parseBound(maxInput);

  const currentValue = trend?.values[shownIndex] ?? null;
  const status = getThresholdStatus(currentValue, min, max);
  const markerColor = THRESHOLD_COLOR[status];

  // The chip in the fleet row mirrors this device's status — but only while
  // it's the one selected, since that's the only device with a live value here.
  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    const node = plotRef.current;
    if (!node || !trend) return;

    // Only what's been measured so far — same rule as the heatmap: a real
    // instrument can't show you readings it hasn't taken yet.
    const measured = trend.values.slice(0, shownIndex + 1);

    const traces = [
      {
        x: measured.map((_, i) => i),
        y: measured,
        type: "scatter" as const,
        mode: "lines" as const,
        line: { width: 2, color: "#4f9cf9" },
      },
      {
        x: [shownIndex],
        y: [trend.values[shownIndex] ?? null],
        type: "scatter" as const,
        mode: "markers" as const,
        marker: { size: 10, color: markerColor },
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Plotly.js ships no types; kept loose like the rest of this file's traces/layout.
    const shapes: any[] = [
      {
        type: "line" as const,
        x0: shownIndex,
        x1: shownIndex,
        yref: "paper" as const,
        y0: 0,
        y1: 1,
        line: { color: "#f9a84f", width: 1, dash: "dot" as const },
      },
    ];
    if (min !== null) {
      shapes.push({
        type: "line" as const,
        xref: "paper" as const,
        x0: 0,
        x1: 1,
        y0: min,
        y1: min,
        line: { color: THRESHOLD_COLOR.below, width: 1, dash: "dash" as const },
      });
    }
    if (max !== null) {
      shapes.push({
        type: "line" as const,
        xref: "paper" as const,
        x0: 0,
        x1: 1,
        y0: max,
        y1: max,
        line: { color: THRESHOLD_COLOR.above, width: 1, dash: "dash" as const },
      });
    }

    const layout = {
      ...BASE_LAYOUT,
      // Fixed to the full run so the measured part grows into a stable frame
      // instead of the x-axis rescaling to fit each new point (same reasoning
      // as the heatmap's fixed y-axis).
      xaxis: { ...BASE_LAYOUT.xaxis, range: [0, trend.total - 1] },
      shapes,
    };

    if (!plotted.current) {
      Plotly.newPlot(node, traces, layout, { responsive: true, displaylogo: false });
      plotted.current = true;
    } else {
      Plotly.react(node, traces, layout);
    }
  }, [trend, shownIndex, markerColor, min, max]);

  const lastIndex = trend ? trend.total - 1 : 0;

  return (
    <section className="panel trend-panel">
      <header className="panel-header">
        <h2>Trend</h2>
        <span className="panel-subtitle">
          {trend ? `${trend.wavenumber} cm⁻¹ · click the spectrum to change` : "loading…"}
        </span>
      </header>

      <div className="threshold-row">
        {/* Shows the actual scale — absorbance here runs ~0 to ~0.05, easy to
            miss and type a min/max that the reading will never reach. */}
        <span className="threshold-current">
          now: <b>{currentValue !== null ? currentValue.toFixed(4) : "—"}</b>
        </span>
        <label className="threshold-field">
          <span>Min</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            placeholder="e.g. 0.01"
            value={minInput}
            onChange={(event) => setMinInput(event.target.value)}
          />
        </label>
        <label className="threshold-field">
          <span>Max</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            placeholder="e.g. 0.04"
            value={maxInput}
            onChange={(event) => setMaxInput(event.target.value)}
          />
        </label>
        {status !== "unset" && (
          <span className={`threshold-badge threshold-${status}`}>
            {status === "in-range" ? "in range" : status === "below" ? "below min" : "above max"}
          </span>
        )}
      </div>

      {error && <p className="panel-error">{error}</p>}
      <div ref={plotRef} className="plot trend-plot" />
      <div className="scrubber">
        <input
          type="range"
          min={0}
          max={lastIndex}
          value={shownIndex}
          disabled={!online || !trend}
          onChange={(event) => {
            const index = Number(event.target.value);
            setDragIndex(index);
            jump(index);
          }}
          onPointerUp={() => setDragIndex(null)}
          onBlur={() => setDragIndex(null)}
        />
        <span className="scrubber-label">
          {shownIndex} / {lastIndex}
        </span>
      </div>
    </section>
  );
}
