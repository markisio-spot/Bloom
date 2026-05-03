import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const API_BASE = "/api";

const SUBJECTS = [
  { key: "math",      label: "Math",       emoji: "➗" },
  { key: "grammar",   label: "Grammar",    emoji: "📝" },
  { key: "history",   label: "History",    emoji: "📜" },
  { key: "geography", label: "Geography",  emoji: "🌍" },
  { key: "french",    label: "French",     emoji: "🇫🇷" },
  { key: "spanish",   label: "Spanish",    emoji: "🇪🇸" },
  { key: "maltese",   label: "Maltese",    emoji: "🇲🇹" },
  { key: "italian",   label: "Italian",    emoji: "🇮🇹" },
];

interface QuestionStat { subject: string; count: number }
interface StoredQuestion {
  id: number; subject: string; grade: number; exerciseType: string;
  languageSection: number | null; questionData: Record<string, unknown>; isActive: boolean; createdAt: string;
}

export default function AdminScreen() {
  const colors = useColors();
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"stats" | "browse" | "generate">("stats");
  const [stats, setStats] = useState<QuestionStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("math");
  const [selectedGrade, setSelectedGrade] = useState("5");
  const [total, setTotal] = useState(0);
  const [genSubject, setGenSubject] = useState("all");
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.center}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.lockText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Admin access only
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/questions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as QuestionStat[];
      setStats(data);
    } catch {}
    setStatsLoading(false);
  };

  const fetchQuestions = async () => {
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams({ subject: selectedSubject, grade: selectedGrade, limit: "20" });
      const res = await fetch(`${API_BASE}/questions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { questions: StoredQuestion[]; total: number };
      setQuestions(data.questions ?? []);
      setTotal(data.total ?? 0);
    } catch {}
    setBrowseLoading(false);
  };

  const deleteQuestion = async (id: number) => {
    Alert.alert("Delete Question", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await fetch(`${API_BASE}/questions/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          setQuestions((prev) => prev.filter((q) => q.id !== id));
          setTotal((t) => t - 1);
        },
      },
    ]);
  };

  const triggerGenerate = async () => {
    setGenLoading(true);
    setGenResult(null);
    try {
      const body = genSubject === "all" ? { questionsPerCombo: 10 } : { subject: genSubject, questionsPerCombo: 10 };
      const res = await fetch(`${API_BASE}/questions/generate-batch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { message: string; totalTasks: number; subject: string };
      setGenResult(`✅ Started! ${data.totalTasks} generation tasks running in background for "${data.subject}". Questions will appear in the bank within a few minutes.`);
    } catch {
      setGenResult("❌ Failed to start generation. Please try again.");
    }
    setGenLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Feather name="settings" size={22} color={colors.primary} />
          <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Admin Console
          </Text>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["stats", "browse", "generate"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tabBtn, tab === t && { backgroundColor: colors.primary }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, { color: tab === t ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                {t === "stats" ? "📊 Stats" : t === "browse" ? "🔍 Browse" : "⚡ Generate"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Stats Tab ── */}
        {tab === "stats" && (
          <View style={styles.section}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={fetchStats}
              disabled={statsLoading}
            >
              {statsLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.primaryBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  Refresh Stats
                </Text>
              )}
            </Pressable>

            {stats.length === 0 && !statsLoading && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Tap "Refresh Stats" to see question counts per subject.
              </Text>
            )}

            {stats.map((s) => {
              const subj = SUBJECTS.find((x) => x.key === s.subject);
              return (
                <View key={s.subject} style={[styles.statRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statEmoji]}>{subj?.emoji ?? "📚"}</Text>
                  <View style={styles.statInfo}>
                    <Text style={[styles.statLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {subj?.label ?? s.subject}
                    </Text>
                  </View>
                  <View style={[styles.statBadge, { backgroundColor: s.count > 0 ? colors.correct + "20" : colors.muted }]}>
                    <Text style={[styles.statCount, { color: s.count > 0 ? colors.correct : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                      {s.count.toLocaleString()}
                    </Text>
                    <Text style={[styles.statUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Qs
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Browse Tab ── */}
        {tab === "browse" && (
          <View style={styles.section}>
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterChips}>
                    {SUBJECTS.map((s) => (
                      <Pressable
                        key={s.key}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selectedSubject === s.key ? colors.primary : colors.card,
                            borderColor: selectedSubject === s.key ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedSubject(s.key)}
                      >
                        <Text style={[styles.chipText, { color: selectedSubject === s.key ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                          {s.emoji} {s.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Grade</Text>
                <TextInput
                  style={[styles.gradeInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  value={selectedGrade}
                  onChangeText={setSelectedGrade}
                  keyboardType="number-pad"
                  placeholder="1-12"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={fetchQuestions}
              disabled={browseLoading}
            >
              {browseLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.primaryBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  Search ({total > 0 ? `${total} found` : "?"})
                </Text>
              )}
            </Pressable>

            {questions.map((q) => {
              const data = q.questionData as { question?: string; type?: string; correctAnswer?: string };
              return (
                <View key={q.id} style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.questionCardHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: colors.primary + "18" }]}>
                      <Text style={[styles.typeBadgeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                        {data.type ?? "?"} · G{q.grade}
                      </Text>
                    </View>
                    <Pressable onPress={() => deleteQuestion(q.id)} style={styles.deleteBtn}>
                      <Feather name="trash-2" size={16} color={colors.wrong} />
                    </Pressable>
                  </View>
                  <Text style={[styles.questionText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]} numberOfLines={3}>
                    {data.question ?? "No question text"}
                  </Text>
                  <Text style={[styles.answerText, { color: colors.correct, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                    ✓ {data.correctAnswer ?? "?"}
                  </Text>
                </View>
              );
            })}

            {questions.length === 0 && !browseLoading && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Select a subject and grade, then tap Search.
              </Text>
            )}
          </View>
        )}

        {/* ── Generate Tab ── */}
        {tab === "generate" && (
          <View style={styles.section}>
            <View style={[styles.infoBox, { backgroundColor: colors.primary + "0E", borderColor: colors.primary + "30" }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                This generates ~10 questions per subject/grade/section combo using AI and saves them to the database. Generation runs in the background — check Stats to see progress.
              </Text>
            </View>

            <Text style={[styles.filterLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Generate for subject:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <Pressable
                  style={[styles.chip, { backgroundColor: genSubject === "all" ? colors.gold : colors.card, borderColor: genSubject === "all" ? colors.gold : colors.border }]}
                  onPress={() => setGenSubject("all")}
                >
                  <Text style={[styles.chipText, { color: genSubject === "all" ? colors.primary : colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    🌟 All Subjects
                  </Text>
                </Pressable>
                {SUBJECTS.map((s) => (
                  <Pressable
                    key={s.key}
                    style={[styles.chip, { backgroundColor: genSubject === s.key ? colors.primary : colors.card, borderColor: genSubject === s.key ? colors.primary : colors.border }]}
                    onPress={() => setGenSubject(s.key)}
                  >
                    <Text style={[styles.chipText, { color: genSubject === s.key ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                      {s.emoji} {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              style={[styles.generateBtn, { backgroundColor: colors.gold }]}
              onPress={triggerGenerate}
              disabled={genLoading}
            >
              {genLoading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <Feather name="zap" size={18} color={colors.primary} />
                  <Text style={[styles.generateBtnText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    Start Generation
                  </Text>
                </>
              )}
            </Pressable>

            {genResult && (
              <View style={[styles.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.resultText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  {genResult}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 100, gap: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  lockText: { fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  title: { fontSize: 22 },
  tabBar: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabBtnText: { fontSize: 12 },
  section: { gap: 14 },
  primaryBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  primaryBtnText: { fontSize: 15 },
  emptyText: { textAlign: "center", fontSize: 14, paddingVertical: 20 },
  statRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  statEmoji: { fontSize: 22 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 15 },
  statBadge: { flexDirection: "row", alignItems: "baseline", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statCount: { fontSize: 20 },
  statUnit: { fontSize: 12 },
  filterRow: { gap: 12 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 13 },
  filterChips: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  gradeInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, width: 80,
  },
  questionCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 8,
  },
  questionCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 12 },
  deleteBtn: { padding: 4 },
  questionText: { fontSize: 14, lineHeight: 20 },
  answerText: { fontSize: 13 },
  infoBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  generateBtn: {
    paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10,
    shadowColor: "#F5C518", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  generateBtnText: { fontSize: 16 },
  resultBox: { padding: 16, borderRadius: 14, borderWidth: 1 },
  resultText: { fontSize: 14, lineHeight: 21 },
});
