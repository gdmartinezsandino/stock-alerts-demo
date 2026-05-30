import React from "react";
import { View } from "react-native";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { colors } from "../theme";

interface Props {
  data: number[];
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
}

/* Minimal dependency-free line chart drawn with react-native-svg.
   Auto-scales to the data range and renders a baseline + end-point marker. */
export function LineChart({
  data,
  width,
  height,
  color = colors.primary,
  strokeWidth = 2,
}: Props) {
  const padding = 6;
  const w = width - padding * 2;
  const h = height - padding * 2;

  if (data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * w;
    const y = padding + h - ((v - min) / range) * h;
    return { x, y };
  });

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const last = points[points.length - 1];

  return (
    <Svg width={width} height={height}>
      <Line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke={colors.border}
        strokeWidth={1}
      />
      <Path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <Circle cx={last.x} cy={last.y} r={3.5} fill={color} />
    </Svg>
  );
}
