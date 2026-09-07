import { useEffect, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";
import { useTrend } from "../hooks/useTrend";
import { useSimulationActions } from "../hooks/useSimulation";

type Props = {
  deviceId: string;
  wavenumber: number;
  currentIndex: number;
  online: boolean;
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

export function TrendPanel({ deviceId, wavenumber, currentIndex, online }: Props) {
  const { trend, error } = useTrend(deviceId, wavenumber);
  const { jump } = useSimulationActions(deviceId);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const plotted = useRef(false);
  // While dragging, follow the slider rather than the 500ms poll — otherwise
  // the two fight each other and the handle jumps back under the cursor.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const shownIndex = dragIndex ?? currentIndex;

  useEffect(() => {
    const node = plotRef.current;
    if (!node || !trend) return;

    const traces = [
      {
        x: trend.values.map((_, i) => i),
        y: trend.values,
        type: "scatter" as const,
        mode: "lines" as const,
        line: { width: 2, color: "#4f9cf9" },
      },
      {
        x: [shownIndex],
        y: [trend.values[shownIndex] ?? null],
        type: "scatter" as const,
        mode: "markers" as const,
        marker: { size: 10, color: "#f9a84f" },
      },
    ];

    const layout = {
      ...BASE_LAYOUT,
      shapes: [
        {
          type: "line" as const,
          x0: shownIndex,
          x1: shownIndex,
          yref: "paper" as const,
          y0: 0,
          y1: 1,
          line: { color: "#f9a84f", width: 1, dash: "dot" as const },
        },
      ],
    };

    if (!plotted.current) {
      Plotly.newPlot(node, traces, layout, { responsive: true, displaylogo: false });
      plotted.current = true;
    } else {
      Plotly.react(node, traces, layout);
    }
  }, [trend, shownIndex]);

  const lastIndex = trend ? trend.total - 1 : 0;

  return (
    <section className="panel trend-panel">
      <header className="panel-header">
        <h2>Trend</h2>
        <span className="panel-subtitle">
          {trend ? `${trend.wavenumber} cm⁻¹ · click the spectrum to change` : "loading…"}
        </span>
      </header>
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
