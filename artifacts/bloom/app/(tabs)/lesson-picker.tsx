import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const EXERCISE_MAP: Record<string, Array<{ key: string; label: string; desc: string; icon: string }>> = {
  languages: [
    { key: "vocabulary", label: "Vocabulary", desc: "Learn new words", icon: "grid" },
    { key: "fill_blank", label: "Fill in the Blank", desc: "Complete sentences", icon: "edit-3" },
    { key: "matching", label: "Matching", desc: "Match pairs of words", icon: "link" },
    { key: "writing", label: "Writing", desc: "Write in the language", icon: "pen-tool" },
    { key: "speaking", label: "Speaking", desc: "Say phrases aloud", icon: "mic" },
    { key: "listening", label: "Listening", desc: "Hear and understand", icon: "headphones" },
  ],
  grammar: [
    { key: "spelling", label: "Spelling", desc: "Spell words correctly", icon: "type" },
    { key: "punctuation", label: "Punctuation", desc: "Use punctuation right", icon: "minus" },
    { key: "parts_of_speech", label: "Parts of Speech", desc: "Identify word types", icon: "tag" },
    { key: "word_definitions", label: "Word Definitions", desc: "Know your vocabulary", icon: "book-open" },
  ],
  history: [
    { key: "reading", label: "Story Reading", desc: "Read + answer questions", icon: "book" },
  ],
  geography: [
    { key: "reading", label: "Story Reading", desc: "Explore the world", icon: "map" },
  ],
};

const LANGUAGES = [
  { key: "french", label: "French", flag: "🇫🇷" },
  { key: "spanish", label: "Spanish", flag: "🇪🇸" },
  { key: "maltese", label: "Maltese", flag: "🇲🇹" },
  { key: "italian", label: "Italian", flag: "🇮🇹" },
];

const SUBJECT_LABELS: Record<string, string> = {
  math: "Math",
  languages: "Languages",
  grammar: "Grammar",
  history: "History",
  geography: "Geography",
};

const SUBJECT_COLORS: Record<string, string> = {
  math: "#4F46E5",
  languages: "#0891B2",
  grammar: "#7C3AED",
  history: "#B45309",
  geography: "#065F46",
};

export default function LessonPickerScreen() {
  const colors = useColors();
  const router = useRouter();
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("french");
  const [selectedLevel, setSelectedLevel] = useState(5);

  const subjectKey = subject ?? "math";
  const exercises = EXERCISE_MAP[subjectKey] ?? [];
  const subjectColor = SUBJECT_COLORS[subjectKey] ?? colors.primary;
  const isMath = subjectKey === "math";
  const needsLanguage = subjectKey === "languages";
  const needsLevel = subjectKey === "math" || subjectKey === "grammar";

  const handleExercise = (exerciseKey: string) => {
    const params: Record<string, string> = {
      subject: needsLanguage ? selectedLanguage : subjectKey,
      exerciseType: exerciseKey,
      level: String(selectedLevel),
    };
    router.push({ pathname: "/(tabs)/lesson", params });
  };

  const handleStartMath = () => {
    router.push({
      pathname: "/(tabs)/lesson",
      params: {
        subject: "math",
        exerciseType: "mixed",
        level: String(selectedLevel),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <View style={[styles.subjectBadge, { backgroundColor: subjectColor + "18" }]}>
          <Text style={[styles.subjectLabel, { color: subjectColor, fontFamily: "Inter_700Bold" }]}>
            {SUBJECT_LABELS[subjectKey]}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {isMath ? (
          <>
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              Math Lesson
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Each session mixes multiple choice, fill-in-the-blank, and word problems automatically.
            </Text>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Grade Level
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.levelRow}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((lvl) => (
                    <Pressable
                      key={lvl}
                      style={[
                        styles.levelBtn,
                        {
                          backgroundColor: selectedLevel === lvl ? colors.primary : colors.card,
                          borderColor: selectedLevel === lvl ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedLevel(lvl)}
                    >
                      <Text style={[
                        styles.levelBtnText,
                        {
                          fontFamily: "Inter_600SemiBold",
                          color: selectedLevel === lvl ? "#fff" : colors.primary,
                        },
                      ]}>
                        {lvl}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={[styles.mathInfoCard, { backgroundColor: subjectColor + "10", borderColor: subjectColor + "30" }]}>
              <View style={[styles.mathInfoIcon, { backgroundColor: subjectColor + "18" }]}>
                <Feather name="shuffle" size={22} color={subjectColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mathInfoTitle, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Mixed Lesson — 6 Questions
                </Text>
                <Text style={[styles.mathInfoDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Multiple choice · Fill in the blank · Word problems
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.startBtn, { backgroundColor: subjectColor }]}
              onPress={handleStartMath}
            >
              <Feather name="play" size={20} color="#fff" />
              <Text style={[styles.startBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                Start Lesson
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              Choose Exercise
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Pick a type of exercise to practice
            </Text>

            {needsLanguage && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Language
                </Text>
                <View style={styles.langRow}>
                  {LANGUAGES.map((lang) => (
                    <Pressable
                      key={lang.key}
                      style={[
                        styles.langBtn,
                        {
                          backgroundColor: selectedLanguage === lang.key ? colors.primary : colors.card,
                          borderColor: selectedLanguage === lang.key ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedLanguage(lang.key)}
                    >
                      <Text style={styles.flagText}>{lang.flag}</Text>
                      <Text style={[
                        styles.langLabel,
                        {
                          fontFamily: "Inter_500Medium",
                          color: selectedLanguage === lang.key ? "#fff" : colors.primary,
                        },
                      ]}>
                        {lang.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {needsLevel && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Grade Level
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.levelRow}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((lvl) => (
                      <Pressable
                        key={lvl}
                        style={[
                          styles.levelBtn,
                          {
                            backgroundColor: selectedLevel === lvl ? colors.primary : colors.card,
                            borderColor: selectedLevel === lvl ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedLevel(lvl)}
                      >
                        <Text style={[
                          styles.levelBtnText,
                          {
                            fontFamily: "Inter_600SemiBold",
                            color: selectedLevel === lvl ? "#fff" : colors.primary,
                          },
                        ]}>
                          {lvl}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Exercise Type
              </Text>
              <View style={styles.exerciseList}>
                {exercises.map((ex) => (
                  <Pressable
                    key={ex.key}
                    style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleExercise(ex.key)}
                  >
                    <View style={[styles.exIcon, { backgroundColor: subjectColor + "18" }]}>
                      <Feather name={ex.icon as "check"} size={22} color={subjectColor} />
                    </View>
                    <View style={styles.exInfo}>
                      <Text style={[styles.exTitle, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                        {ex.label}
                      </Text>
                      <Text style={[styles.exDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {ex.desc}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  subjectBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  subjectLabel: { fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, marginBottom: 10 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  flagText: { fontSize: 18 },
  langLabel: { fontSize: 14 },
  levelRow: { flexDirection: "row", gap: 8 },
  levelBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBtnText: { fontSize: 15 },
  exerciseList: { gap: 10 },
  exCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  exIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  exInfo: { flex: 1, gap: 2 },
  exTitle: { fontSize: 15 },
  exDesc: { fontSize: 12 },
  mathInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  mathInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mathInfoTitle: { fontSize: 15, marginBottom: 3 },
  mathInfoDesc: { fontSize: 12 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startBtnText: { fontSize: 17 },
});
