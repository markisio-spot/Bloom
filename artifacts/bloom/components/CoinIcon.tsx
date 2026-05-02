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
  const fr = r * 0.52;

  const petalPath = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const petal = fr * 0.4;
    const cx = r + Math.cos(rad) * petal * 1.15;
    const cy = r + Math.sin(rad) * petal * 1.15;
    return `M ${r} ${r} C ${r + Math.cos(rad - 0.85) * petal * 1.6} ${r + Math.sin(rad - 0.85) * petal * 1.6} ${r + Math.cos(rad + 0.85) * petal * 1.6} ${r + Math.sin(rad + 0.85) * petal * 1.6} ${cx} ${cy} Z`;
  };

  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={r} cy={r} r={r - 0.5} fill="#F5C518" />
      <Circle cx={r} cy={r} r={r * 0.8} fill="#E8B008" />
      <Circle cx={r} cy={r} r={r * 0.74} fill="#F5C518" />
      <G>
        {angles.map((a) => (
          <Path key={a} d={petalPath(a)} fill={colors.primary} opacity={0.88} />
        ))}
        <Circle cx={r} cy={r} r={fr * 0.28} fill={colors.primary} />
        <Circle cx={r} cy={r} r={fr * 0.13} fill="rgba(255,255,255,0.3)" />
      </G>
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
