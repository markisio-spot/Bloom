import { Feather } from "@expo/vector-icons";
import { useGetProgress, getGetProgressQueryKey } from "@workspace/api-client-react";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const LANGUAGE_SECTIONS = [
  { num: 1,  name: "Greetings & Farewells" },
  { num: 2,  name: "Numbers 1–20" },
  { num: 3,  name: "Colors" },
  { num: 4,  name: "Days of the Week" },
  { num: 5,  name: "Months of the Year" },
  { num: 6,  name: "Family Members" },
  { num: 7,  name: "Food & Drinks" },
  { num: 8,  name: "Clothing" },
  { num: 9,  name: "Weather & Seasons" },
  { num: 10, name: "Grammar: Articles & Gender" },
  { num: 11, name: "Body Parts & Health" },
  { num: 12, name: "Time Expressions" },
  { num: 13, name: "Grammar: Present Tense Verbs" },
  { num: 14, name: "Animals & Nature" },
  { num: 15, name: "Grammar: Adjectives" },
  { num: 16, name: "Sentence Translation (Beginner)" },
  { num: 17, name: "Grammar: Past Tense" },
  { num: 18, name: "Sentence Translation (Advanced)" },
];

const EXERCISE_MAP: Record<string, Array<{ key: string; label: string; desc: string; icon: string }>> = {
  grammar: [
    { key: "spelling",        label: "Spelling",          desc: "Spell words correctly",      icon: "type"      },
    { key: "punctuation",     label: "Punctuation",       desc: "Use punctuation right",       icon: "minus"     },
    { key: "parts_of_speech", label: "Parts of Speech",   desc: "Identify word types",         icon: "tag"       },
    { key: "word_definitions",label: "Word Definitions",  desc: "Know your vocabulary",        icon: "book-open" },
  ],
  history: [
    { key: "reading", label: "Story Reading", desc: "Read + answer questions", icon: "book" },
  ],
  geography: [
    { key: "reading", label: "Story Reading", desc: "Explore the world", icon: "map" },
  ],
};

const LANGUAGES = [
  { key: "french",  label: "French",  flag: "🇫🇷" },
  { key: "spanish", label: "Spanish", flag: "🇪🇸" },
  { key: "maltese", label: "Maltese", flag: "🇲🇹" },
  { key: "italian", label: "Italian", flag: "🇮🇹" },
];

const SUBJECT_LABELS: Record<string, string> = {
  math: "Math", languages: "Languages", grammar: "Grammar",
  history: "History", geography: "Geography",
};

const SUBJECT_COLORS: Record<string, string> = {
  math: "#4F46E5", languages: "#0891B2", grammar: "#7C3AED",
  history: "#B45309", geography: "#065F46",
};

export default function LessonPickerScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuth();
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("french");
  const [selectedLevel, setSelectedLevel] = useState(5);

  const subjectKey = subject ?? "math";
  const exercises = EXERCISE_MAP[subjectKey] ?? [];
  const subjectColor = SUBJECT_COLORS[subjectKey] ?? colors.primary;
  const isMath = subjectKey === "math";
  const isLanguages = subjectKey === "languages";
  const needsLevel = subjectKey === "math" || subjectKey === "grammar";

  const { data: progress, isLoading: progressLoading } = useGetProgress({
    query: {
      enabled: !!token && isLanguages,
      queryKey: getGetProgressQueryKey(),
    },
  });

  // Find language section for selected language
  const langProgress = progress?.find((p) => p.subject === selectedLanguage);
  const currentSection = Math.min(langProgress?.languageSection ?? 1, 18);
  const sectionInfo = LANGUAGE_SECTIONS[currentSection - 1] ?? LANGUAGE_SECTIONS[0]!;
  const nextSection = LANGUAGE_SECTIONS[currentSection] ?? null; // section after current (0-indexed)
  const isComplete = currentSection >= 18;

  const handleStartLanguage = () => {
    router.push({
      pathname: "/(tabs)/lesson",
      params: {
        subject: selectedLanguage,
        exerciseType: "auto",
        level: String(langProgress?.currentLevel ?? 1),
        languageSection: String(currentSection),
      },
    });
  };

  const handleExercise = (exerciseKey: string) => {
    router.push({
      pathname: "/(tabs)/lesson",
      params: { subject: subjectKey, exerciseType: exerciseKey, level: String(selectedLevel) },
    });
  };

  const handleStartMath = () => {
    router.push({
      pathname: "/(tabs)/lesson",
      params: { subject: "math", exerciseType: "mixed", level: String(selectedLevel) },
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

        {/* ── Math ── */}
        {isMath && (
          <>
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Math Lesson</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Each session mixes multiple choice, fill-in-the-blank, and word problems automatically.
            </Text>
            <LevelPicker
              selected={selectedLevel}
              onSelect={setSelectedLevel}
              colors={colors}
            />
            <View style={[styles.infoCard, { backgroundColor: subjectColor + "10", borderColor: subjectColor + "30" }]}>
              <View style={[styles.infoIcon, { backgroundColor: subjectColor + "18" }]}>
                <Feather name="shuffle" size={22} color={subjectColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Mixed Lesson — 6 Questions
                </Text>
                <Text style={[styles.infoDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Multiple choice · Fill in the blank · Word problems
                </Text>
              </View>
            </View>
            <Pressable style={[styles.startBtn, { backgroundColor: subjectColor }]} onPress={handleStartMath}>
              <Feather name="play" size={20} color="#fff" />
              <Text style={[styles.startBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Start Lesson</Text>
            </Pressable>
          </>
        )}

        {/* ── Languages ── */}
        {isLanguages && (
          <>
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Languages</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Work through structured sections and pick up where you left off.
            </Text>

            {/* Language picker */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Language</Text>
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
                      { fontFamily: "Inter_500Medium", color: selectedLanguage === lang.key ? "#fff" : colors.primary },
                    ]}>
                      {lang.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Current section card */}
            {progressLoading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <>
                {/* Progress bar */}
                <View style={styles.section}>
                  <View style={styles.sectionProgressRow}>
                    <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      Your Progress
                    </Text>
                    <Text style={[styles.sectionCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {Math.min(currentSection, 18)}/18 sections
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: subjectColor,
                          width: `${Math.min((currentSection / 18) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Section info card */}
                {isComplete ? (
                  <View style={[styles.sectionCard, { backgroundColor: colors.correct + "12", borderColor: colors.correct }]}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: colors.correct + "20" }]}>
                      <Text style={{ fontSize: 28 }}>🏆</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionName, { color: colors.correct, fontFamily: "Inter_700Bold" }]}>
                        Curriculum Complete!
                      </Text>
                      <Text style={[styles.sectionMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        You've finished all 18 sections. Amazing work!
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.sectionCard, { backgroundColor: subjectColor + "0E", borderColor: subjectColor + "40" }]}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: subjectColor + "18" }]}>
                      <Text style={{ fontSize: 28 }}>📖</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        Currently on · Section {currentSection}/18
                      </Text>
                      <Text style={[styles.sectionName, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                        {sectionInfo.name}
                      </Text>
                      {nextSection && (
                        <Text style={[styles.sectionNext, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          Next: {nextSection.name}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                <Pressable
                  style={[styles.startBtn, { backgroundColor: subjectColor, opacity: isComplete ? 0.6 : 1 }]}
                  onPress={handleStartLanguage}
                  disabled={isComplete}
                >
                  <Feather name="play" size={20} color="#fff" />
                  <Text style={[styles.startBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                    {isComplete ? "All Done!" : "Start Lesson"}
                  </Text>
                </Pressable>

                {/* Section list */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    All Sections
                  </Text>
                  {LANGUAGE_SECTIONS.map((sec) => {
                    const isDone = sec.num < currentSection;
                    const isCurrent = sec.num === currentSection;
                    return (
                      <View
                        key={sec.num}
                        style={[
                          styles.sectionListItem,
                          {
                            backgroundColor: isCurrent ? subjectColor + "10" : colors.card,
                            borderColor: isCurrent ? subjectColor : isDone ? colors.correct + "40" : colors.border,
                            borderWidth: isCurrent ? 2 : 1.5,
                          },
                        ]}
                      >
                        <View style={[
                          styles.sectionNumBadge,
                          {
                            backgroundColor: isDone ? colors.correct : isCurrent ? subjectColor : colors.border,
                          },
                        ]}>
                          {isDone
                            ? <Feather name="check" size={12} color="#fff" />
                            : <Text style={[styles.sectionNumText, { color: isCurrent ? "#fff" : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                                {sec.num}
                              </Text>
                          }
                        </View>
                        <Text style={[
                          styles.sectionListName,
                          {
                            color: isDone ? colors.mutedForeground : isCurrent ? colors.primary : colors.foreground,
                            fontFamily: isCurrent ? "Inter_600SemiBold" : "Inter_400Regular",
                          },
                        ]}>
                          {sec.name}
                        </Text>
                        {isCurrent && (
                          <View style={[styles.currentTag, { backgroundColor: subjectColor }]}>
                            <Text style={[styles.currentTagText, { fontFamily: "Inter_700Bold" }]}>Now</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* ── Grammar / History / Geography ── */}
        {!isMath && !isLanguages && (
          <>
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Choose Exercise</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Pick a type of exercise to practice
            </Text>

            {needsLevel && (
              <LevelPicker selected={selectedLevel} onSelect={setSelectedLevel} colors={colors} />
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
                      <Text style={[styles.exTitle, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{ex.label}</Text>
                      <Text style={[styles.exDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{ex.desc}</Text>
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

// ── Level picker sub-component ─────────────────────────────────────────────────

function LevelPicker({
  selected,
  onSelect,
  colors,
}: {
  selected: number;
  onSelect: (v: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Grade Level</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.levelRow}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((lvl) => (
            <Pressable
              key={lvl}
              style={[
                styles.levelBtn,
                {
                  backgroundColor: selected === lvl ? colors.primary : colors.card,
                  borderColor: selected === lvl ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelect(lvl)}
            >
              <Text style={[styles.levelBtnText, { fontFamily: "Inter_600SemiBold", color: selected === lvl ? "#fff" : colors.primary }]}>
                {lvl}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  subjectBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  subjectLabel: { fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, marginBottom: 10 },
  sectionProgressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionCount: { fontSize: 12 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  sectionLoading: { paddingVertical: 40, alignItems: "center" },
  sectionCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 2, marginBottom: 20,
  },
  sectionIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sectionName: { fontSize: 16, marginBottom: 2 },
  sectionMeta: { fontSize: 12, marginBottom: 4 },
  sectionNext: { fontSize: 12 },
  sectionListItem: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 12, borderRadius: 14, marginBottom: 8,
  },
  sectionNumBadge: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  sectionNumText: { fontSize: 12 },
  sectionListName: { flex: 1, fontSize: 14 },
  currentTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  currentTagText: { color: "#fff", fontSize: 11 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
  },
  flagText: { fontSize: 18 },
  langLabel: { fontSize: 14 },
  levelRow: { flexDirection: "row", gap: 8 },
  levelBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  levelBtnText: { fontSize: 15 },
  exerciseList: { gap: 10 },
  exCard: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 16, borderWidth: 1.5, gap: 12,
  },
  exIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  exInfo: { flex: 1, gap: 2 },
  exTitle: { fontSize: 15 },
  exDesc: { fontSize: 12 },
  infoCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 24,
  },
  infoIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: 15, marginBottom: 3 },
  infoDesc: { fontSize: 12 },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 24,
  },
  startBtnText: { fontSize: 17 },
});
