import { useEffect, useMemo, useRef, useState } from "react";
 /import Plotly from "plotly.js-dist-min";
import type { SpectrumResponse } from "../hooks/useSpectrum";
import { useFleetSpectrum } from "../hooks/useFleetSpectrum";
import { useHeatmap } from "../hooks/useHeatmap";

type View = "single" | "compare" | "heatmap";

type Props = {
  deviceId: string;
  deviceName: string;
  spectrum: SpectrumResponse | null;
  error: string | null;
  online: boolean;
  selectedWavenumber: number;
  onSelectWavenumber: (wavenumber: number) => void;
};

const BASE_LAYOUT = {
  margin: { t: 24, r: 24, b: 48, l: 56 },
  xaxis: { title: { text: "Wavenumber (cm)" } },
  yaxis: { title: { text: "Absorbance [mAU]" }, range: [-0.002, 0.09] },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { color: "#c8ccd4" },
};

/**
 * Single-hue blue ramp for the heatmap, stepped for this app's dark panel
 * (#1b1e24) rather than flipped from a light-mode scale: on a dark surface the
 * low end has to stay *brighter* than the background or "no signal" disappears
 * into the card. Validated for monotone lightness, visible step gaps, single
 * hue, and a low end that clears the surface at 2.07:1.
 */
const HEAT_COLORSCALE: [number, string][] = [
  [0, "#31536f"],
  [0.17, "#3a6699"],
  [0.33, "#437cbb"],
  [0.5, "#4f93dc"],
  [0.67, "#6dabe9"],
  [0.83, "#9bc7f4"],
  [1, "#c8e0fc"],
];

const VIEW_LABELS: Record<View, string> = {
  single: "This device",
  compare: "Compare all online",
  heatmap: "All readings",
};

export function ChartPanel({
  deviceId,
  deviceName,
  spectrum,
  error,
  online,
  selectedWavenumber,
  onSelectWavenumber,
}: Props) {
  const [view, setView] = useState<View>("single");
  const plotRef = useRef<HTMLDivElement | null>(null);
  const plotted = useRef(false);
  // Plotly only turns the div into an event emitter once newPlot runs, and the
  // first render has no data to plot yet. This flips when the plot exists, so
  // the click effect below knows to (re-)attach.
  const [plotReady, setPlotReady] = useState(false);
  const { spectra: fleetSpectra, error: fleetError } = useFleetSpectrum(view === "compare");
  const { heatmap, error: heatmapError } = useHeatmap(deviceId, view === "heatmap");
  const currentIndex = spectrum?.index ?? 0;

  // Colour limits come from the whole run, not from the rows drawn so far —
  // otherwise every new reading rescales the ramp and the early, near-flat part
  // of the run gets painted as if it were full of signal.
  const heatRange = useMemo(() => {
    if (!heatmap) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const row of heatmap.values) {
      for (const value of row) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    return { min, max };
  }, [heatmap]);

  useEffect(() => {
    const node = plotRef.current;
    if (!node) return;

    // Marks which wavenumber the trend chart below is following.
    const selectionShape = {
      type: "line" as const,
      x0: selectedWavenumber,
      x1: selectedWavenumber,
      yref: "paper" as const,
      y0: 0,
      y1: 1,
      line: { color: "#f9a84f", width: 1, dash: "dot" as const },
    };

    let traces;
    let layout;

    if (view === "heatmap") {
      if (!heatmap || !heatRange) return;
      // Only what's been measured so far: a real instrument can't show you
      // readings it hasn't taken yet. The full matrix is already client-side
      // (it's a replay), so growing the picture costs no extra requests.
      const measured = heatmap.values.slice(0, currentIndex + 1);
      traces = [
        {
          z: measured,
          x: heatmap.wavenumbers,
          y: measured.map((_, i) => i),
          type: "heatmap" as const,
          colorscale: HEAT_COLORSCALE,
          zmin: heatRange.min,
          zmax: heatRange.max,
          colorbar: { title: { text: "Absorbance" }, thickness: 12, outlinewidth: 0 },
        },
      ];
      layout = {
        ...BASE_LAYOUT,
        // Fixed to the full run so the measured part grows into a stable frame
        // instead of always stretching to fill the panel.
        yaxis: { title: { text: "Reading #" }, range: [0, heatmap.total - 1] },
        showlegend: false,
        shapes: [
          selectionShape,
          // Where the live reading currently sits in the run.
          {
            type: "line" as const,
            xref: "paper" as const,
            x0: 0,
            x1: 1,
            y0: currentIndex,
            y1: currentIndex,
            line: { color: "#f9a84f", width: 1, dash: "dot" as const },
          },
        ],
      };
    } else if (view === "compare") {
      if (fleetSpectra.length === 0) return;
      traces = fleetSpectra.map((s) => ({
        x: s.wavenumbers,
        y: s.data,
        type: "scatter" as const,
        name: s.name,
        line: { width: s.id === deviceId ? 3 : 1.25 },
        opacity: s.id === deviceId ? 1 : 0.55,
      }));
      layout = {
        ...BASE_LAYOUT,
        showlegend: true,
        legend: { orientation: "h" as const, y: -0.25 },
        shapes: [selectionShape],
      };
    } else {
      if (!spectrum) return;
      traces = [{ x: spectrum.wavenumbers, y: spectrum.data, type: "scatter" as const, name: deviceName }];
      layout = { ...BASE_LAYOUT, showlegend: false, shapes: [selectionShape] };
    }

    if (!plotted.current) {
      Plotly.newPlot(node, traces, layout, { responsive: true, displaylogo: false });
      plotted.current = true;
      setPlotReady(true);
    } else {
      Plotly.react(node, traces, layout);
    }
  }, [view, fleetSpectra, heatmap, heatRange, spectrum, deviceId, deviceName, selectedWavenumber, currentIndex]);

  // Clicking a point picks the wavenumber the trend chart follows. Waits for
  // plotReady — before newPlot the div has no .on to attach to; Plotly.react
  // afterwards keeps the listener alive.
  useEffect(() => {
    if (!plotReady) return;
    const node = plotRef.current as (HTMLDivElement & {
      on?: (event: string, handler: (data: { points: { x: number }[] }) => void) => void;
      removeAllListeners?: (event: string) => void;
    }) | null;
    if (!node?.on) return;

    const handler = (data: { points: { x: number }[] }) => {
      const point = data.points[0];
      if (point) onSelectWavenumber(Math.round(point.x));
    };
    node.on("plotly_click", handler);
    return () => node.removeAllListeners?.("plotly_click");
  }, [plotReady, onSelectWavenumber]);

  return (
    <section className="panel chart-panel">
      <header className="panel-header">
        <h2>Spectrum</h2>
        <div className="chart-toggle">
          {(Object.keys(VIEW_LABELS) as View[]).map((option) => (
            <button
              key={option}
              className={view === option ? "active" : ""}
              onClick={() => setView(option)}
            >
              {VIEW_LABELS[option]}
            </button>
          ))}
        </div>
      </header>
      {view === "single" && spectrum && (
        <span className="panel-subtitle">
          reading #{spectrum.index}
          {!online && " · offline, showing last known reading"}
        </span>
      )}
      {view === "compare" && (
        <span className="panel-subtitle">
          {fleetSpectra.length} online device(s) — {deviceName} highlighted
        </span>
      )}
      {view === "heatmap" && (
        <span className="panel-subtitle">
          {heatmap
            ? `${currentIndex + 1} of ${heatmap.total} readings measured — brighter is more absorbance`
            : "loading…"}
        </span>
      )}
      {error && view === "single" && <p className="panel-error">{error}</p>}
      {fleetError && view === "compare" && <p className="panel-error">{fleetError}</p>}
      {heatmapError && view === "heatmap" && <p className="panel-error">{heatmapError}</p>}
      <div ref={plotRef} className="plot" />
    </section>
  );
}
