import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

interface CoinIconProps {
  size?: number;
  count?: number | string | null;
  textStyle?: object;
  style?: object;
}

export function CoinSvg({ size = 20 }: { size?: number }) {
  const colors = useColors();
  const r = size / 2;

  // Rose petal pointing upward from origin
  const oph = r * 0.64;  // outer petal half-height
  const opw = r * 0.25;  // outer petal half-width
  const iph = r * 0.43;  // inner petal half-height
  const ipw = r * 0.18;  // inner petal half-width

  const outerPetal = `M 0 0 C ${opw} ${-oph * 0.1} ${opw * 0.6} ${-oph * 0.78} 0 ${-oph} C ${-opw * 0.6} ${-oph * 0.78} ${-opw} ${-oph * 0.1} 0 0 Z`;
  const innerPetal = `M 0 0 C ${ipw} ${-iph * 0.1} ${ipw * 0.6} ${-iph * 0.78} 0 ${-iph} C ${-ipw * 0.6} ${-iph * 0.78} ${-ipw} ${-iph * 0.1} 0 0 Z`;

  const col = colors.primary;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Gold coin body */}
      <Circle cx={r} cy={r} r={r - 0.5} fill="#F5C518" />
      <Circle cx={r} cy={r} r={r * 0.82} fill="#E8B008" />
      <Circle cx={r} cy={r} r={r * 0.76} fill="#F5C518" />

      {/* Rose — 5 outer petals */}
      {[0, 72, 144, 216, 288].map((a) => (
        <G key={`op${a}`} transform={`translate(${r},${r}) rotate(${a})`}>
          <Path d={outerPetal} fill={col} opacity={0.65} />
        </G>
      ))}

      {/* Rose — 5 inner petals, rotated 36° */}
      {[36, 108, 180, 252, 324].map((a) => (
        <G key={`ip${a}`} transform={`translate(${r},${r}) rotate(${a})`}>
          <Path d={innerPetal} fill={col} opacity={0.88} />
        </G>
      ))}

      {/* Rose centre bud */}
      <Circle cx={r} cy={r} r={r * 0.14} fill={col} />
      <Circle cx={r} cy={r} r={r * 0.07} fill="rgba(255,255,255,0.4)" />
    </Svg>
  );
}

export default function CoinIcon({ size = 20, count, textStyle, style }: CoinIconProps) {
  const colors = useColors();

  if (count == null) {
    return <CoinSvg size={size} />;
  }

  return (
    <View style={[styles.row, style]}>
      <CoinSvg size={size} />
      <Text
        style={[
          styles.text,
          { color: colors.gold, fontSize: size * 0.75, fontFamily: "Inter_700Bold" },
          textStyle,
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  text: {},
});
