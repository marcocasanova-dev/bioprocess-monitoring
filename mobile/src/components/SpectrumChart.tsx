import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Polyline, Text as SvgText } from "react-native-svg";

type Props = {
  wavenumbers: number[];
  data: number[];
};

const HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };
// Hardcoded after inspecting min/max in the sample data, same as the web app.
const Y_MIN = -0.002;
const Y_MAX = 0.085;
const Y_TICKS = [0, 0.02, 0.04, 0.06, 0.08];
const X_TICK_COUNT = 6;

export function SpectrumChart({ wavenumbers, data }: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 0);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const xMin = wavenumbers[0] ?? 0;
  const xMax = wavenumbers[wavenumbers.length - 1] ?? 1;
  const xSpan = xMax - xMin || 1;

  const xScale = (x: number) => PADDING.left + ((x - xMin) / xSpan) * plotWidth;
  const yScale = (y: number) => PADDING.top + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotHeight;

  const points = wavenumbers.map((wn, i) => `${xScale(wn)},${yScale(data[i] ?? 0)}`).join(" ");
  const xTicks = Array.from({ length: X_TICK_COUNT }, (_, i) => xMin + (xSpan * i) / (X_TICK_COUNT - 1));

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {Y_TICKS.map((t) => (
            <Line
              key={`grid-${t}`}
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="#2a2e36"
              strokeWidth={1}
            />
          ))}
          {Y_TICKS.map((t) => (
            <SvgText key={`yl-${t}`} x={PADDING.left - 8} y={yScale(t) + 4} fontSize={10} fill="#9aa0ab" textAnchor="end">
              {t.toFixed(2)}
            </SvgText>
          ))}
          {xTicks.map((t) => (
            <SvgText key={`xl-${t}`} x={xScale(t)} y={HEIGHT - 8} fontSize={10} fill="#9aa0ab" textAnchor="middle">
              {Math.round(t)}
            </SvgText>
          ))}
          {points.length > 0 && <Polyline points={points} fill="none" stroke="#4c8dff" strokeWidth={1.5} />}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: HEIGHT,
  },
});
