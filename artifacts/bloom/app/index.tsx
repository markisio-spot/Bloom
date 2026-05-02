import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

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
      <View style={styles.content}>
        <View style={[styles.logoCircle, { backgroundColor: colors.gold }]}>
          <Feather name="star" size={52} color={colors.primary} />
        </View>

        <Text style={[styles.appName, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
          Bloom
        </Text>
        <Text style={[styles.tagline, { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" }]}>
          Learn. Earn. Collect.{"\n"}Your journey starts here.
        </Text>

        <View style={styles.featureRow}>
          {[
            { icon: "book-open" as const, label: "AI Lessons" },
            { icon: "award" as const, label: "Earn Coins" },
            { icon: "heart" as const, label: "Collect Animals" },
          ].map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: "rgba(245,197,24,0.15)" }]}>
                <Feather name={f.icon} size={22} color={colors.gold} />
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
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  appName: {
    fontSize: 52,
    letterSpacing: -1,
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
