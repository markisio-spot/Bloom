import { Feather } from "@expo/vector-icons";
import { useGetProgress, getGetProgressQueryKey } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = [
  {
    key: "math",
    label: "Math",
    emoji: "🔢",
    description: "Arithmetic, algebra, geometry & more",
    icon: "hash" as const,
    color: "#4F46E5",
    exercises: ["Multiple Choice", "Fill in Blank", "Word Problems"],
  },
  {
    key: "languages",
    label: "Languages",
    emoji: "🌍",
    description: "French, Spanish, Maltese, Italian",
    icon: "globe" as const,
    color: "#0891B2",
    exercises: ["Vocabulary", "Fill in Blank", "Matching", "Speaking", "Listening"],
  },
  {
    key: "grammar",
    label: "English Grammar",
    emoji: "📝",
    description: "Spelling, punctuation, parts of speech",
    icon: "type" as const,
    color: "#7C3AED",
    exercises: ["Spelling", "Punctuation", "Parts of Speech", "Definitions"],
  },
  {
    key: "history",
    label: "History",
    emoji: "📜",
    description: "Story-style readings + comprehension",
    icon: "clock" as const,
    color: "#B45309",
    exercises: ["Reading + Comprehension"],
  },
  {
    key: "geography",
    label: "Geography",
    emoji: "🗺️",
    description: "Countries, landmarks, natural wonders",
    icon: "map" as const,
    color: "#065F46",
    exercises: ["Reading + Comprehension"],
  },
];

export default function LearnScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuth();

  const { data: progress } = useGetProgress({
    query: {
      enabled: !!token,
      queryKey: getGetProgressQueryKey(),
    },
  });

  const levelFor = (subject: string) => {
    const p = progress?.find((pr) => pr.subject === subject);
    return p?.currentLevel ?? 1;
  };

  const completedFor = (subject: string) => {
    const p = progress?.find((pr) => pr.subject === subject);
    return p?.lessonsCompleted ?? 0;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          ✏️ Learn
        </Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Pick a subject to practice
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {SUBJECTS.map((subject) => {
          const level = levelFor(subject.key);
          const done = completedFor(subject.key);
          return (
            <Pressable
              key={subject.key}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                  transform: [{ translateY: pressed ? 2 : 0 }],
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/lesson-picker",
                  params: { subject: subject.key },
                })
              }
            >
              {/* Cartoon 3-D shadow bar */}
              <View style={[styles.cardShadow, { backgroundColor: colors.primary }]} />

              <View style={styles.cardInner}>
                <View style={[styles.iconWrap, { backgroundColor: subject.color }]}>
                  <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                      {subject.label}
                    </Text>
                    <View style={[styles.levelBadge, { backgroundColor: subject.color }]}>
                      <Text style={[styles.levelText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                        Lv {level}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {subject.description}
                  </Text>

                  <View style={styles.cardBottom}>
                    <View style={styles.exerciseTypes}>
                      {subject.exercises.slice(0, 2).map((ex) => (
                        <View key={ex} style={[styles.exTag, { backgroundColor: subject.color + "20", borderColor: subject.color + "50" }]}>
                          <Text style={[styles.exTagText, { color: subject.color, fontFamily: "Inter_600SemiBold" }]}>
                            {ex}
                          </Text>
                        </View>
                      ))}
                      {subject.exercises.length > 2 && (
                        <Text style={[styles.moreTag, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          +{subject.exercises.length - 2}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.completedText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      ⭐ {done} done
                    </Text>
                  </View>
                </View>

                <Feather name="chevron-right" size={20} color={colors.primary} />
              </View>
            </Pressable>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  screenTitle: { fontSize: 30 },
  screenSubtitle: { fontSize: 14, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  card: {
    borderRadius: 20,
    borderWidth: 2.5,
    marginBottom: 2,
    position: "relative",
  },
  cardShadow: {
    position: "absolute",
    bottom: -4,
    left: 2,
    right: -2,
    height: "100%",
    borderRadius: 20,
    zIndex: 0,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderRadius: 18,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.15)",
  },
  subjectEmoji: { fontSize: 26 },
  cardContent: { flex: 1, gap: 5 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16 },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
  },
  levelText: { fontSize: 11 },
  cardDesc: { fontSize: 12 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  exerciseTypes: { flexDirection: "row", gap: 5, alignItems: "center" },
  exTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  exTagText: { fontSize: 10 },
  moreTag: { fontSize: 11 },
  completedText: { fontSize: 11 },
});
