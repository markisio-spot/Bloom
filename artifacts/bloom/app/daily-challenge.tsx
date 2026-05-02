import { Feather } from "@expo/vector-icons";
import {
  useGetDailyChallenge,
  useCompleteDailyChallenge,
  useGetMe,
  getGetDailyChallengeQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
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
import CoinIcon from "@/components/CoinIcon";

interface ChallengeQuestion {
  id: string;
  question: string;
  type: "multiple_choice";
  options: string[];
  correctAnswer: string;
}

export default function DailyChallengeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"quiz" | "results">("quiz");
  const [coinsEarned, setCoinsEarned] = useState(0);

  const { data: challenge, isLoading } = useGetDailyChallenge({
    query: { enabled: !!token, queryKey: getGetDailyChallengeQueryKey() },
  });

  const completeMutation = useCompleteDailyChallenge({
    mutation: {
      onSuccess: (data) => {
        setCoinsEarned(data.coinsEarned);
        updateUser({ coins: data.newBalance ?? 0 });
        queryClient.invalidateQueries({ queryKey: getGetDailyChallengeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setPhase("results");
      },
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!challenge || challenge.completed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loader}>
          <Feather name="check-circle" size={64} color={colors.correct} />
          <Text style={[styles.completedTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Challenge Complete!
          </Text>
          <Text style={[styles.completedSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Come back tomorrow for a new challenge.
          </Text>
          <Pressable style={[styles.homeBtn, { backgroundColor: colors.primary }]} onPress={() => router.replace("/(tabs)")}>
            <Text style={[{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 }]}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const questions = (challenge.questions as unknown as ChallengeQuestion[]) ?? [];

  if (phase === "results") {
    const pct = Math.round((score / Math.max(questions.length, 1)) * 100);
    const passed = pct >= 60;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.resultsHeader, { backgroundColor: passed ? colors.correct : colors.wrong }]}>
          <Feather name={passed ? "award" : "refresh-cw"} size={56} color="#fff" />
          <Text style={[styles.resultTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
            {passed ? "Challenge Passed!" : "Keep Trying!"}
          </Text>
          <Text style={[styles.resultPct, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{pct}%</Text>
          <Text style={[styles.resultScore, { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" }]}>
            {score} of {questions.length} correct
          </Text>
        </View>
        <View style={styles.resultBody}>
          {coinsEarned > 0 && (
            <View style={[styles.coinsRow, { backgroundColor: colors.gold + "15", borderColor: colors.gold }]}>
              <CoinIcon size={26} count={`+${coinsEarned} coins earned!`} textStyle={{ color: colors.primary, fontSize: 18 }} />
            </View>
          )}
          <Pressable
            style={[styles.homeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={[{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 }]}>
              Back to Home
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[currentQ];
  if (!q) return null;

  const isSubmitted = submitted[currentQ] ?? false;
  const userAnswer = answers[currentQ] ?? "";
  const isCorrect = isSubmitted && userAnswer === q.correctAnswer;

  const handleSubmit = () => {
    if (!userAnswer) return;
    const correct = userAnswer === q.correctAnswer;
    setSubmitted((prev) => ({ ...prev, [currentQ]: true }));
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ === questions.length - 1) {
      const finalAnswers = Object.values({ ...answers });
      completeMutation.mutate({
        data: {
          challengeId: challenge.id,
          answers: finalAnswers,
        },
      });
    } else {
      setCurrentQ((c) => c + 1);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Daily Challenge
          </Text>
          <View style={[styles.rewardBadge, { backgroundColor: colors.gold + "20" }]}>
            <CoinIcon size={18} count={challenge.coinReward} textStyle={{ color: colors.primary, fontSize: 14 }} />
          </View>
        </View>
        <View style={styles.progressPills}>
          {questions.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.pill,
                {
                  backgroundColor: idx < currentQ
                    ? colors.correct
                    : idx === currentQ
                      ? colors.primary
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.challengeInfo, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.challengeTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {challenge.title}
          </Text>
          <Text style={[styles.challengeDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {challenge.description}
          </Text>
        </View>

        <Text style={[styles.qNumber, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Question {currentQ + 1} of {questions.length}
        </Text>
        <Text style={[styles.qText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          {q.question}
        </Text>

        <View style={styles.options}>
          {q.options?.map((opt) => {
            const isSelected = userAnswer === opt;
            const isThisCorrect = isSubmitted && opt === q.correctAnswer;
            const isThisWrong = isSubmitted && isSelected && opt !== q.correctAnswer;
            return (
              <Pressable
                key={opt}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: isThisCorrect
                      ? colors.correct + "20"
                      : isThisWrong
                        ? colors.wrong + "20"
                        : isSelected
                          ? colors.primary + "15"
                          : colors.card,
                    borderColor: isThisCorrect
                      ? colors.correct
                      : isThisWrong
                        ? colors.wrong
                        : isSelected
                          ? colors.primary
                          : colors.border,
                  },
                ]}
                onPress={() => !isSubmitted && setAnswers((prev) => ({ ...prev, [currentQ]: opt }))}
                disabled={isSubmitted}
              >
                <Text style={[
                  styles.optionText,
                  {
                    color: isThisCorrect
                      ? colors.correct
                      : isThisWrong
                        ? colors.wrong
                        : isSelected
                          ? colors.primary
                          : colors.foreground,
                    fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}>
                  {opt}
                </Text>
                {isThisCorrect && <Feather name="check-circle" size={18} color={colors.correct} />}
                {isThisWrong && <Feather name="x-circle" size={18} color={colors.wrong} />}
              </Pressable>
            );
          })}
        </View>

        {isSubmitted && (
          <View style={[
            styles.feedback,
            { backgroundColor: isCorrect ? colors.correct + "15" : colors.wrong + "15", borderColor: isCorrect ? colors.correct : colors.wrong },
          ]}>
            <Feather name={isCorrect ? "check-circle" : "x-circle"} size={18} color={isCorrect ? colors.correct : colors.wrong} />
            <Text style={[styles.feedbackText, { color: isCorrect ? colors.correct : colors.wrong, fontFamily: "Inter_600SemiBold" }]}>
              {isCorrect ? "Correct!" : `Correct answer: ${q.correctAnswer}`}
            </Text>
          </View>
        )}

        {!isSubmitted ? (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.primary }, !userAnswer && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!userAnswer}
          >
            <Text style={[styles.actionText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              Check Answer
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: isCorrect ? colors.correct : colors.primary }]}
            onPress={handleNext}
            disabled={completeMutation.isPending}
          >
            <Text style={[styles.actionText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              {completeMutation.isPending ? "Submitting..." : currentQ === questions.length - 1 ? "Finish Challenge" : "Next Question"}
            </Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  completedTitle: { fontSize: 24, textAlign: "center" },
  completedSubtitle: { fontSize: 15, textAlign: "center" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 20 },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rewardText: { fontSize: 14 },
  progressPills: { flexDirection: "row", gap: 6 },
  pill: { flex: 1, height: 4, borderRadius: 2 },
  quizContent: { paddingHorizontal: 20 },
  challengeInfo: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 4,
  },
  challengeTitle: { fontSize: 15 },
  challengeDesc: { fontSize: 13 },
  qNumber: { fontSize: 13, marginBottom: 8 },
  qText: { fontSize: 18, lineHeight: 28, marginBottom: 20 },
  options: { gap: 10 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  optionText: { flex: 1, fontSize: 15 },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 16,
  },
  feedbackText: { fontSize: 14 },
  actionBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  actionText: { fontSize: 16 },
  resultsHeader: {
    padding: 40,
    alignItems: "center",
    gap: 12,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  resultTitle: { fontSize: 24 },
  resultPct: { fontSize: 52 },
  resultScore: { fontSize: 16 },
  resultBody: { padding: 24, gap: 16 },
  coinsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  coinsText: { fontSize: 18 },
  homeBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
