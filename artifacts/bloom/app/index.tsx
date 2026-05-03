import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Ellipse,
  Path,
  G,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const { width: SW, height: SH } = Dimensions.get("window");

function FlowerLogo({ size, color }: { size: number; color: string }) {
  const r = size / 2;
  const petal = r * 0.38;
  const petalPath = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const cx = r + Math.cos(rad) * petal * 1.1;
    const cy = r + Math.sin(rad) * petal * 1.1;
    return `M ${r} ${r} C ${r + Math.cos(rad - 0.8) * petal * 1.6} ${r + Math.sin(rad - 0.8) * petal * 1.6} ${r + Math.cos(rad + 0.8) * petal * 1.6} ${r + Math.sin(rad + 0.8) * petal * 1.6} ${cx} ${cy} Z`;
  };
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G>
        {angles.map((a) => (
          <Path key={a} d={petalPath(a)} fill={color} opacity={0.9} />
        ))}
        <Circle cx={r} cy={r} r={r * 0.28} fill={color} />
        <Circle cx={r} cy={r} r={r * 0.14} fill="rgba(255,255,255,0.35)" />
      </G>
    </Svg>
  );
}

function BackgroundTexture() {
  const dots: { cx: number; cy: number; r: number; opacity: number }[] = [
    { cx: 30, cy: 80, r: 2.5, opacity: 0.18 },
    { cx: SW - 40, cy: 120, r: 3, opacity: 0.14 },
    { cx: 60, cy: SH * 0.3, r: 1.8, opacity: 0.2 },
    { cx: SW - 25, cy: SH * 0.38, r: 2, opacity: 0.16 },
    { cx: SW * 0.2, cy: SH * 0.18, r: 3.5, opacity: 0.1 },
    { cx: SW * 0.75, cy: SH * 0.22, r: 2.2, opacity: 0.15 },
    { cx: SW * 0.85, cy: SH * 0.55, r: 1.5, opacity: 0.13 },
    { cx: SW * 0.1, cy: SH * 0.62, r: 2.8, opacity: 0.12 },
    { cx: SW * 0.5, cy: SH * 0.08, r: 2, opacity: 0.17 },
    { cx: SW * 0.3, cy: SH * 0.72, r: 1.8, opacity: 0.1 },
    { cx: SW * 0.9, cy: SH * 0.75, r: 2.4, opacity: 0.13 },
  ];

  const waveY = SH * 0.72;
  const wave1 = `M 0 ${waveY} C ${SW * 0.15} ${waveY - 38} ${SW * 0.35} ${waveY + 28} ${SW * 0.5} ${waveY} C ${SW * 0.65} ${waveY - 28} ${SW * 0.85} ${waveY + 38} ${SW} ${waveY} L ${SW} ${SH} L 0 ${SH} Z`;
  const wave2 = `M 0 ${waveY + 32} C ${SW * 0.2} ${waveY + 32 - 30} ${SW * 0.4} ${waveY + 32 + 22} ${SW * 0.6} ${waveY + 32} C ${SW * 0.75} ${waveY + 32 - 22} ${SW * 0.9} ${waveY + 32 + 30} ${SW} ${waveY + 32} L ${SW} ${SH} L 0 ${SH} Z`;
  const arcTop = `M -${SW * 0.1} ${SH * 0.15} Q ${SW * 0.5} ${-SH * 0.04} ${SW * 1.1} ${SH * 0.15}`;
  const arcMid = `M -${SW * 0.1} ${SH * 0.44} Q ${SW * 0.5} ${SH * 0.3} ${SW * 1.1} ${SH * 0.44}`;

  return (
    <Svg
      width={SW}
      height={SH}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {dots.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="white" opacity={d.opacity} />
      ))}
      <Path d={arcTop} stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} fill="none" />
      <Path d={arcMid} stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} fill="none" />
      <Path d={wave1} fill="rgba(255,255,255,0.05)" />
      <Path d={wave2} fill="rgba(255,255,255,0.04)" />
      <Ellipse cx={SW * 0.5} cy={SH * 0.32} rx={SW * 0.55} ry={SH * 0.22} fill="rgba(255,255,255,0.025)" />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("bloom_token");
      if (token) {
        router.replace("/(tabs)");
      } else {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <BackgroundTexture />

      <View style={styles.content}>
        <View style={[styles.logoCircle, { backgroundColor: colors.gold }]}>
          <FlowerLogo size={58} color={colors.primary} />
        </View>

        <Text style={[styles.appName, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
          Bloom Learning
        </Text>
        <Text style={[styles.tagline, { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" }]}>
          Learn. Earn. Collect.{"\n"}Your journey starts here.
        </Text>

        <View style={styles.featureRow}>
          {[
            { label: "AI Lessons", path: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.93V18h-2v-1.07A8 8 0 0 1 4.07 11H6v-2H4.07A8 8 0 0 1 11 3.07V5h2V3.07A8 8 0 0 1 19.93 9H18v2h1.93A8 8 0 0 1 13 16.93z" },
            { label: "Earn Coins", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-6 3 6h-2v4z" },
            { label: "Collect Animals", path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
          ].map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: "rgba(245,197,24,0.15)" }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path d={f.path} fill={colors.gold} />
                </Svg>
              </View>
              <Text style={[styles.featureLabel, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                {f.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
          onPress={() => router.push("/register")}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Get Started
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, { borderColor: "rgba(255,255,255,0.35)" }]}
          onPress={() => router.push("/login")}
        >
          <Text style={[styles.secondaryBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
            I already have an account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#F5C518",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  appName: {
    fontSize: 52,
    letterSpacing: -1,
    textAlign: "center",
  },
  tagline: {
    fontSize: 17,
    textAlign: "center",
    lineHeight: 26,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 24,
  },
  featureItem: {
    alignItems: "center",
    gap: 8,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F5C518",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 17,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 16,
  },
});
