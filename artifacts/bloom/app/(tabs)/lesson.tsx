import { Feather } from "@expo/vector-icons";
import {
  useEarnCoins,
  useGenerateLesson,
  useSaveProgress,
  useTextToSpeech,
  type GenerateLessonBodySubject,
} from "@workspace/api-client-react";
import { Audio } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  const [phase, setPhase] = useState<"loading" | "audio" | "quiz" | "results">("loading");
  const [score, setScore] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

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

  const saveProgressMutation = useSaveProgress({
    mutation: {},
  });

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
            Powered by AI
          </Text>
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} size="large" />
        </View>
      </SafeAreaView>
    );
  }

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
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={() => setPhase("quiz")}
            disabled={audioPlaying}
          >
            <Text style={[styles.startBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              {audioPlaying ? "Listening..." : "Start Questions"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "results") {
    const total = lesson?.questions.length ?? 0;
    const correct = score;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const coinsEarned = Math.max(10, Math.round((pct / 100) * 50));
    const passed = pct >= 60;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={[styles.resultHeader, { backgroundColor: passed ? colors.correct : colors.wrong }]}>
            <Feather name={passed ? "award" : "refresh-cw"} size={48} color="#fff" />
            <Text style={[styles.resultTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {passed ? "Great work!" : "Keep practicing!"}
            </Text>
            <Text style={[styles.resultPct, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {pct}%
            </Text>
            <Text style={[styles.resultScore, { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" }]}>
              {correct} of {total} correct
            </Text>
          </View>

          <View style={styles.resultBody}>
            <View style={[styles.coinsEarned, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="star" size={24} color={colors.gold} />
              <Text style={[styles.coinsEarnedText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                +{coinsEarned} coins earned!
              </Text>
            </View>

            <Pressable
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/(tabs)/learn")}
            >
              <Text style={[styles.doneBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                Continue Learning
              </Text>
            </Pressable>

            <Pressable
              style={[styles.retryBtn, { borderColor: colors.border }]}
              onPress={() => {
                setPhase("loading");
                setCurrentQ(0);
                setAnswers({});
                setSubmitted({});
                setScore(0);
                setMatchedPairs([]);
                generateMutation.mutate({
                  data: {
                    subject: (params.subject ?? "math") as GenerateLessonBodySubject,
                    exerciseType: params.exerciseType ?? "multiple_choice",
                    level: Number(params.level) || 5,
                  },
                });
              }}
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

  if (!lesson || !lesson.questions?.length) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[{ color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            No questions generated. Try again.
          </Text>
          <Pressable style={[styles.startBtn, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => router.back()}>
            <Text style={[{ color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
      const finalScore = score + (isCorrect ? 0 : 0);
      const coinsEarned = Math.max(10, Math.round((finalScore / questions.length) * 50));
      earnCoinsMutation.mutate({ data: { amount: coinsEarned } });
      saveProgressMutation.mutate({
        data: {
          subject: params.subject ?? "math",
          level: Number(params.level) || 5,
          score: Math.round((finalScore / questions.length) * 100),
          exerciseType: params.exerciseType ?? "multiple_choice",
        },
      });
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
        const left = prevSide === "left" ? prevValue : value;
        const right = prevSide === "right" ? prevValue : value;
        setMatchedPairs((prev) => [...prev, [left, right]]);
        setAnswers((prev) => ({ ...prev, [currentQ]: "matched" }));
      }
      setMatchSelected(null);
    }
  };

  const isMatchedLeft = (val: string) => matchedPairs.some(([l]) => l === val);
  const isMatchedRight = (val: string) => matchedPairs.some(([, r]) => r === val);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.lessonHeader}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((currentQ + 1) / questions.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.qCounter, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {currentQ + 1}/{questions.length}
        </Text>
      </View>

      {lesson.content && currentQ === 0 && (
        <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 140 }}>
            <Text style={[styles.contentText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
              {lesson.content}
            </Text>
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.qContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.qTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          {q.question}
        </Text>

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
                        ? colors.correct + "20"
                        : isThisWrong
                          ? colors.wrong + "20"
                          : isSelected
                            ? colors.primary + "18"
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
                  Correct: {q.correctAnswer}
                </Text>
              </View>
            )}
          </View>
        )}

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
                        ? colors.correct + "20"
                        : matchSelected === `left:${p.left}`
                          ? colors.primary + "20"
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
            <Feather name="arrow-right" size={20} color={colors.mutedForeground} style={{ alignSelf: "center" }} />
            <View style={styles.matchCol}>
              {q.pairs.map((p) => (
                <Pressable
                  key={p.right}
                  style={[
                    styles.matchItem,
                    {
                      backgroundColor: isMatchedRight(p.right)
                        ? colors.correct + "20"
                        : matchSelected === `right:${p.right}`
                          ? colors.primary + "20"
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

        {isSubmitted && q.type !== "match" && (
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
              {isCorrect ? "Correct!" : "Not quite!"}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          {!isSubmitted ? (
            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary },
                !userAnswer && q.type !== "fill_blank" && q.type !== "write" && q.type !== "match" && { opacity: 0.5 },
              ]}
              onPress={handleSubmitCurrent}
              disabled={
                (q.type === "multiple_choice" && !userAnswer) ||
                ((q.type === "fill_blank" || q.type === "write") && !textInput.trim())
              }
            >
              <Text style={[styles.submitBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                Check Answer
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.submitBtn, { backgroundColor: isCorrect ? colors.correct : colors.primary }]}
              onPress={handleNext}
            >
              <Text style={[styles.submitBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                {currentQ === questions.length - 1 ? "See Results" : "Next Question"}
              </Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
        <View style={{ height: 100 }} />
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
    flex: 1,
    margin: 0,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  audioIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  audioTitle: { fontSize: 22 },
  audioSubtitle: { fontSize: 15 },
  startBtn: { height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  startBtnText: { fontSize: 16 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E0E8FF",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  qCounter: { fontSize: 13 },
  contentCard: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  contentText: { fontSize: 14, lineHeight: 22 },
  qContent: { paddingHorizontal: 20, paddingTop: 12 },
  qTitle: { fontSize: 18, lineHeight: 28, marginBottom: 20 },
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
  inputSection: { gap: 10 },
  answerInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    minHeight: 52,
  },
  correctAnswerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  correctAnswerText: { fontSize: 14 },
  matchContainer: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  matchCol: { flex: 1, gap: 8 },
  matchItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  matchText: { fontSize: 14, textAlign: "center" },
  feedbackBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 16,
  },
  feedbackText: { fontSize: 15 },
  actionRow: { marginTop: 20 },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#1B3A6B",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitBtnText: { fontSize: 16 },
  resultsContent: { flexGrow: 1 },
  resultHeader: {
    padding: 40,
    alignItems: "center",
    gap: 12,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  resultTitle: { fontSize: 26 },
  resultPct: { fontSize: 56 },
  resultScore: { fontSize: 16 },
  resultBody: { padding: 24, gap: 16 },
  coinsEarned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  coinsEarnedText: { fontSize: 18 },
  doneBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { fontSize: 16 },
  retryBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1.5,
  },
  retryBtnText: { fontSize: 15 },
});
