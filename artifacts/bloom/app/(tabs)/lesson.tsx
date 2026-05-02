import { Feather } from "@expo/vector-icons";
import {
  useEarnCoins,
  useGenerateLesson,
  useSaveProgress,
  useTextToSpeech,
  type GenerateLessonBodySubject,
} from "@workspace/api-client-react";
import { sendLessonCompleteNotification } from "@/utils/notifications";
import { Audio } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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

type QuestionType = "multiple_choice" | "fill_blank" | "match" | "write" | "speak";

interface LessonQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[] | null;
  correctAnswer: string;
  explanation?: string | null;
  pairs?: Array<{ left: string; right: string }> | null;
}

interface Lesson {
  id?: string;
  subject: string;
  exerciseType: string;
  level: number;
  title?: string;
  content?: string;
  audioText?: string | null;
  questions: LessonQuestion[];
}

// ─── Explanation card ─────────────────────────────────────────────────────────

function ExplanationCard({ explanation, isCorrect, colors }: {
  explanation?: string | null;
  isCorrect: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  if (!explanation) return null;
  return (
    <View style={[
      explanationStyles.card,
      {
        backgroundColor: isCorrect ? colors.correct + "12" : "#FFF8E1",
        borderColor: isCorrect ? colors.correct : colors.gold,
        borderLeftColor: isCorrect ? colors.correct : colors.gold,
      },
    ]}>
      <View style={explanationStyles.iconRow}>
        <Text style={explanationStyles.bulb}>💡</Text>
        <Text style={[explanationStyles.label, { color: isCorrect ? colors.correct : "#B8860B", fontFamily: "Inter_700Bold" }]}>
          {isCorrect ? "Great job!" : "Here's why:"}
        </Text>
      </View>
      <Text style={[explanationStyles.text, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
        {explanation}
      </Text>
    </View>
  );
}

const explanationStyles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    gap: 6,
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bulb: { fontSize: 16 },
  label: { fontSize: 13 },
  text: { fontSize: 14, lineHeight: 21 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const colors = useColors();
  const router = useRouter();
  const { updateUser } = useAuth();
  const params = useLocalSearchParams<{
    subject: string;
    exerciseType: string;
    level: string;
  }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [textInput, setTextInput] = useState("");
  const [matchSelected, setMatchSelected] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<[string, string]>>([]);
  const [phase, setPhase] = useState<"loading" | "audio" | "quiz" | "results" | "error">("loading");
  const [score, setScore] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const generateMutation = useGenerateLesson({
    mutation: {
      onSuccess: (data) => {
        setLesson(data as unknown as Lesson);
        if ((data as unknown as Lesson).audioText && params.exerciseType === "listening") {
          setPhase("audio");
        } else {
          setPhase("quiz");
        }
      },
      onError: () => {
        setPhase("error");
      },
    },
  });

  const ttsMutation = useTextToSpeech({
    mutation: {
      onSuccess: async (data) => {
        try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(
            { uri: `data:audio/mp3;base64,${data.audio}` },
            { shouldPlay: true }
          );
          soundRef.current = sound;
          setAudioPlaying(true);
          sound.setOnPlaybackStatusUpdate((status) => {
            if ("didJustFinish" in status && status.didJustFinish) {
              setAudioPlaying(false);
            }
          });
        } catch {
          setPhase("quiz");
        }
      },
    },
  });

  const earnCoinsMutation = useEarnCoins({
    mutation: {
      onSuccess: (data) => {
        updateUser({ coins: data.coins });
      },
    },
  });

  const saveProgressMutation = useSaveProgress({ mutation: {} });

  useEffect(() => {
    generateMutation.mutate({
      data: {
        subject: (params.subject ?? "math") as GenerateLessonBodySubject,
        exerciseType: params.exerciseType ?? "multiple_choice",
        level: Number(params.level) || 5,
      },
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (phase === "audio" && lesson?.audioText) {
      ttsMutation.mutate({ data: { text: lesson.audioText, voice: "nova" } });
    }
  }, [phase]);

  // Animate progress bar
  useEffect(() => {
    if (lesson?.questions?.length && phase === "quiz") {
      Animated.timing(progressAnim, {
        toValue: (currentQ + 1) / lesson.questions.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentQ, lesson, phase]);

  // ── Error ──
  if (phase === "error") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text style={[styles.loadingTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Couldn't generate lesson
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Check your connection and try again.
          </Text>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 8, paddingHorizontal: 32 }]}
            onPress={() => {
              setPhase("loading");
              generateMutation.mutate({
                data: {
                  subject: (params.subject ?? "math") as GenerateLessonBodySubject,
                  exerciseType: params.exerciseType ?? "multiple_choice",
                  level: Number(params.level) || 5,
                },
              });
            }}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Try Again</Text>
          </Pressable>
          <Pressable onPress={() => router.dismissAll()} style={{ marginTop: 8 }}>
            <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14 }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (phase === "loading" || generateMutation.isPending) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIcon, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={32} color={colors.gold} />
          </View>
          <Text style={[styles.loadingTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Generating your lesson...
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Powered by AI ✨
          </Text>
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Audio ──
  if (phase === "audio") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.audioContainer}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.primary} />
          </Pressable>
          <View style={[styles.audioCard, { backgroundColor: colors.primary }]}>
            <View style={[styles.audioIconCircle, { backgroundColor: colors.gold }]}>
              <Feather name={audioPlaying ? "volume-2" : "play"} size={40} color={colors.primary} />
            </View>
            <Text style={[styles.audioTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {audioPlaying ? "Listen carefully..." : "Audio ready"}
            </Text>
            <Text style={[styles.audioSubtitle, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
              {audioPlaying ? "Playing audio" : "Audio loaded. Ready to start!"}
            </Text>
          </View>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => setPhase("quiz")}
            disabled={audioPlaying}
          >
            <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              {audioPlaying ? "Listening..." : "Start Questions"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Results ──
  if (phase === "results") {
    const total = lesson?.questions.length ?? 0;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const coinsEarned = Math.max(10, Math.round((pct / 100) * 50));
    const passed = pct >= 60;
    const emoji = pct === 100 ? "🏆" : pct >= 80 ? "⭐" : pct >= 60 ? "👍" : "💪";

    const handleContinue = () => {
      router.dismissAll();
    };

    const handleRetry = () => {
      setPhase("loading");
      setCurrentQ(0);
      setAnswers({});
      setSubmitted({});
      setScore(0);
      setMatchedPairs([]);
      progressAnim.setValue(0);
      generateMutation.mutate({
        data: {
          subject: (params.subject ?? "math") as GenerateLessonBodySubject,
          exerciseType: params.exerciseType ?? "multiple_choice",
          level: Number(params.level) || 5,
        },
      });
    };

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultsContent} bounces={false}>
          {/* Score header */}
          <View style={[styles.resultHeader, { backgroundColor: passed ? colors.correct : colors.wrong }]}>
            <Text style={styles.resultEmoji}>{emoji}</Text>
            <Text style={[styles.resultTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {pct === 100 ? "Perfect!" : passed ? "Great work!" : "Keep practicing!"}
            </Text>
            <Text style={[styles.resultPct, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {pct}%
            </Text>
            <Text style={[styles.resultScore, { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" }]}>
              {score} of {total} correct
            </Text>
          </View>

          <View style={styles.resultBody}>
            {/* Coins */}
            <View style={[styles.coinsEarned, { backgroundColor: colors.gold + "15", borderColor: colors.gold }]}>
              <Text style={{ fontSize: 28 }}>🪙</Text>
              <View>
                <Text style={[styles.coinsEarnedText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  +{coinsEarned} coins earned!
                </Text>
                <Text style={[styles.coinsSubText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Added to your wallet
                </Text>
              </View>
            </View>

            {/* Answer review */}
            {lesson?.questions && lesson.questions.length > 0 && (
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  Answer Review
                </Text>
                {lesson.questions.map((q, idx) => {
                  const userAns = answers[idx] ?? "";
                  const wasCorrect = userAns.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                  return (
                    <View key={idx} style={[styles.reviewItem, { backgroundColor: colors.card, borderColor: wasCorrect ? colors.correct + "60" : colors.wrong + "60" }]}>
                      <View style={styles.reviewItemTop}>
                        <View style={[styles.reviewDot, { backgroundColor: wasCorrect ? colors.correct : colors.wrong }]}>
                          <Feather name={wasCorrect ? "check" : "x"} size={10} color="#fff" />
                        </View>
                        <Text style={[styles.reviewQ, { color: colors.primary, fontFamily: "Inter_500Medium" }]} numberOfLines={2}>
                          {q.question}
                        </Text>
                      </View>
                      {!wasCorrect && (
                        <View style={styles.reviewAnswers}>
                          <Text style={[styles.reviewYours, { color: colors.wrong, fontFamily: "Inter_400Regular" }]}>
                            Your answer: {userAns || "—"}
                          </Text>
                          <Text style={[styles.reviewCorrect, { color: colors.correct, fontFamily: "Inter_600SemiBold" }]}>
                            ✓ {q.correctAnswer}
                          </Text>
                          {q.explanation && (
                            <Text style={[styles.reviewExplanation, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                              💡 {q.explanation}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Buttons */}
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleContinue}
            >
              <Feather name="book-open" size={18} color="#fff" />
              <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                Continue Learning
              </Text>
            </Pressable>

            <Pressable
              style={[styles.retryBtn, { borderColor: colors.border }]}
              onPress={handleRetry}
            >
              <Feather name="refresh-cw" size={16} color={colors.primary} />
              <Text style={[styles.retryBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Try Again
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── No questions fallback ──
  if (!lesson || !lesson.questions?.length) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={[{ color: colors.primary, fontFamily: "Inter_600SemiBold", textAlign: "center" }]}>
            No questions generated. Please try again.
          </Text>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 16, paddingHorizontal: 24 }]} onPress={() => router.dismissAll()}>
            <Text style={[{ color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Quiz ──
  const questions = lesson.questions;
  const q = questions[currentQ];
  if (!q) return null;

  const isSubmitted = submitted[currentQ] ?? false;
  const userAnswer = answers[currentQ] ?? "";
  const isCorrect = isSubmitted && userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();

  const handleSubmitCurrent = () => {
    let answer = userAnswer;
    if (q.type === "fill_blank" || q.type === "write") {
      answer = textInput;
    }
    if (q.type === "match") {
      answer = "matched";
    }

    const correct = answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
    setSubmitted((prev) => ({ ...prev, [currentQ]: true }));
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setTextInput("");
    setMatchSelected(null);
    if (currentQ === questions.length - 1) {
      // score already includes this question via handleSubmitCurrent
      const finalScore = score + (isCorrect ? 0 : 0); // isCorrect already counted
      const coinsEarned = Math.max(10, Math.round((score / questions.length) * 50));
      earnCoinsMutation.mutate({ data: { amount: coinsEarned } });
      sendLessonCompleteNotification(coinsEarned);
      saveProgressMutation.mutate({
        data: {
          subject: params.subject ?? "math",
          level: Number(params.level) || 5,
          score: Math.round((score / questions.length) * 100),
          exerciseType: params.exerciseType ?? "multiple_choice",
        },
      });
      void finalScore;
      setPhase("results");
    } else {
      setCurrentQ((c) => c + 1);
    }
  };

  const handleMatchTap = (side: "left" | "right", value: string) => {
    if (!matchSelected) {
      setMatchSelected(`${side}:${value}`);
    } else {
      const [prevSide, prevValue] = matchSelected.split(":");
      if (prevSide !== side) {
        const left = prevSide === "left" ? prevValue! : value;
        const right = prevSide === "right" ? prevValue! : value;
        setMatchedPairs((prev) => [...prev, [left, right]]);
        setAnswers((prev) => ({ ...prev, [currentQ]: "matched" }));
      }
      setMatchSelected(null);
    }
  };

  const isMatchedLeft = (val: string) => matchedPairs.some(([l]) => l === val);
  const isMatchedRight = (val: string) => matchedPairs.some(([, r]) => r === val);

  const canSubmit = q.type === "multiple_choice"
    ? !!userAnswer
    : (q.type === "fill_blank" || q.type === "write")
      ? !!textInput.trim()
      : q.type === "match"
        ? matchedPairs.length === (q.pairs?.length ?? 0)
        : true;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* ── Header / Progress ── */}
      <View style={styles.lessonHeader}>
        <Pressable style={styles.backBtn} onPress={() => router.dismissAll()}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.qCounter, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {currentQ + 1}/{questions.length}
        </Text>
      </View>

      {/* ── Content card (for reading passages) ── */}
      {lesson.content && currentQ === 0 && (
        <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 140 }}>
            <Text style={[styles.contentText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
              {lesson.content}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* ── Question ── */}
      <ScrollView contentContainerStyle={styles.qContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.qTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          {q.question}
        </Text>

        {/* Multiple choice */}
        {q.type === "multiple_choice" && q.options && (
          <View style={styles.options}>
            {q.options.map((opt) => {
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
                        ? colors.correct + "18"
                        : isThisWrong
                          ? colors.wrong + "18"
                          : isSelected
                            ? colors.primary + "14"
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
        )}

        {/* Fill blank / Write */}
        {(q.type === "fill_blank" || q.type === "write") && (
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.answerInput,
                {
                  borderColor: isSubmitted
                    ? isCorrect ? colors.correct : colors.wrong
                    : colors.border,
                  backgroundColor: colors.card,
                  color: colors.text,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              placeholder="Type your answer..."
              placeholderTextColor={colors.mutedForeground}
              value={textInput}
              onChangeText={setTextInput}
              editable={!isSubmitted}
            />
            {isSubmitted && !isCorrect && (
              <View style={[styles.correctAnswerBox, { backgroundColor: colors.correct + "15" }]}>
                <Feather name="check-circle" size={14} color={colors.correct} />
                <Text style={[styles.correctAnswerText, { color: colors.correct, fontFamily: "Inter_400Regular" }]}>
                  Correct answer: {q.correctAnswer}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Matching */}
        {q.type === "match" && q.pairs && (
          <View style={styles.matchContainer}>
            <View style={styles.matchCol}>
              {q.pairs.map((p) => (
                <Pressable
                  key={p.left}
                  style={[
                    styles.matchItem,
                    {
                      backgroundColor: isMatchedLeft(p.left)
                        ? colors.correct + "18"
                        : matchSelected === `left:${p.left}`
                          ? colors.primary + "18"
                          : colors.card,
                      borderColor: isMatchedLeft(p.left)
                        ? colors.correct
                        : matchSelected === `left:${p.left}`
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => !isSubmitted && handleMatchTap("left", p.left)}
                  disabled={isMatchedLeft(p.left)}
                >
                  <Text style={[styles.matchText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                    {p.left}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.matchArrow}>
              <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
            </View>
            <View style={styles.matchCol}>
              {q.pairs.map((p) => (
                <Pressable
                  key={p.right}
                  style={[
                    styles.matchItem,
                    {
                      backgroundColor: isMatchedRight(p.right)
                        ? colors.correct + "18"
                        : matchSelected === `right:${p.right}`
                          ? colors.primary + "18"
                          : colors.card,
                      borderColor: isMatchedRight(p.right)
                        ? colors.correct
                        : matchSelected === `right:${p.right}`
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => !isSubmitted && handleMatchTap("right", p.right)}
                  disabled={isMatchedRight(p.right)}
                >
                  <Text style={[styles.matchText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                    {p.right}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Feedback bar + explanation */}
        {isSubmitted && q.type !== "match" && (
          <View style={styles.feedbackSection}>
            <View
              style={[
                styles.feedbackBar,
                {
                  backgroundColor: isCorrect ? colors.correct + "15" : colors.wrong + "15",
                  borderColor: isCorrect ? colors.correct : colors.wrong,
                },
              ]}
            >
              <Feather
                name={isCorrect ? "check-circle" : "x-circle"}
                size={18}
                color={isCorrect ? colors.correct : colors.wrong}
              />
              <Text style={[
                styles.feedbackText,
                {
                  color: isCorrect ? colors.correct : colors.wrong,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}>
                {isCorrect ? "Correct! 🎉" : `Not quite — correct: ${q.correctAnswer}`}
              </Text>
            </View>
            <ExplanationCard explanation={q.explanation} isCorrect={isCorrect} colors={colors} />
          </View>
        )}

        {/* Match feedback + explanation */}
        {isSubmitted && q.type === "match" && (
          <View style={styles.feedbackSection}>
            <View style={[styles.feedbackBar, { backgroundColor: colors.correct + "15", borderColor: colors.correct }]}>
              <Feather name="check-circle" size={18} color={colors.correct} />
              <Text style={[styles.feedbackText, { color: colors.correct, fontFamily: "Inter_600SemiBold" }]}>
                Pairs matched!
              </Text>
            </View>
            {q.explanation && (
              <ExplanationCard explanation={q.explanation} isCorrect={true} colors={colors} />
            )}
          </View>
        )}

        {/* Action button */}
        <View style={styles.actionRow}>
          {!isSubmitted ? (
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: colors.primary },
                !canSubmit && { opacity: 0.45 },
              ]}
              onPress={handleSubmitCurrent}
              disabled={!canSubmit}
            >
              <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                Check Answer
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: isCorrect ? colors.correct : colors.primary }]}
              onPress={handleNext}
            >
              <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                {currentQ === questions.length - 1 ? "See Results" : "Next Question"}
              </Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  loadingIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  loadingTitle: { fontSize: 20, textAlign: "center" },
  loadingSubtitle: { fontSize: 14, textAlign: "center" },

  audioContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  audioCard: {
    flex: 1, marginTop: 16, marginBottom: 20,
    borderRadius: 24, alignItems: "center", justifyContent: "center", gap: 16,
  },
  audioIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  audioTitle: { fontSize: 22 },
  audioSubtitle: { fontSize: 15 },

  backBtn: { width: 40, height: 40, justifyContent: "center" },
  lessonHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  qCounter: { fontSize: 13 },

  contentCard: {
    marginHorizontal: 20, padding: 14, borderRadius: 14,
    borderWidth: 1.5, marginBottom: 4,
  },
  contentText: { fontSize: 14, lineHeight: 22 },

  qContent: { paddingHorizontal: 20, paddingTop: 12 },
  qTitle: { fontSize: 18, lineHeight: 28, marginBottom: 20 },

  options: { gap: 10 },
  optionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 8,
  },
  optionText: { flex: 1, fontSize: 15 },

  inputSection: { gap: 10 },
  answerInput: {
    borderWidth: 1.5, borderRadius: 14, padding: 16,
    fontSize: 15, minHeight: 52,
  },
  correctAnswerBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10,
  },
  correctAnswerText: { fontSize: 14 },

  matchContainer: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  matchCol: { flex: 1, gap: 8 },
  matchArrow: { justifyContent: "center", paddingTop: 8 },
  matchItem: { padding: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  matchText: { fontSize: 14, textAlign: "center" },

  feedbackSection: { marginTop: 16, gap: 0 },
  feedbackBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  feedbackText: { fontSize: 14, flex: 1 },

  actionRow: { marginTop: 20 },
  actionBtn: {
    height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
    shadowColor: "#1B3A6B", shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  actionBtnText: { fontSize: 16 },

  // Results
  resultsContent: { flexGrow: 1 },
  resultHeader: {
    paddingTop: 50, paddingBottom: 40, paddingHorizontal: 24,
    alignItems: "center", gap: 10,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  resultEmoji: { fontSize: 52 },
  resultTitle: { fontSize: 24 },
  resultPct: { fontSize: 64, lineHeight: 72 },
  resultScore: { fontSize: 16 },
  resultBody: { padding: 24, gap: 16 },
  coinsEarned: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18, borderRadius: 18, borderWidth: 2,
  },
  coinsEarnedText: { fontSize: 17 },
  coinsSubText: { fontSize: 12, marginTop: 2 },
  reviewSection: { gap: 10 },
  reviewTitle: { fontSize: 17, marginBottom: 4 },
  reviewItem: {
    padding: 14, borderRadius: 14, borderWidth: 1.5, gap: 8,
  },
  reviewItemTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reviewDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0,
  },
  reviewQ: { fontSize: 14, flex: 1, lineHeight: 20 },
  reviewAnswers: { paddingLeft: 30, gap: 4 },
  reviewYours: { fontSize: 13 },
  reviewCorrect: { fontSize: 13 },
  reviewExplanation: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  retryBtn: {
    height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8, borderWidth: 1.5,
  },
  retryBtnText: { fontSize: 15 },
});
