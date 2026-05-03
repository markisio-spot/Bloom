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
  hint?: string | null;
  speakText?: string | null;
  pairs?: Array<{ left: string; right: string }> | null;
}

interface VocabItem {
  word: string;
  meaning: string;
  pronunciation: string;
}

interface Lesson {
  id?: string;
  subject: string;
  exerciseType: string;
  level: number;
  title?: string;
  content?: string;
  audioText?: string | null;
  vocabulary?: VocabItem[];
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
    languageSection: string;
  }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [textInput, setTextInput] = useState("");
  const [matchSelected, setMatchSelected] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<[string, string]>>([]);
  const [phase, setPhase] = useState<"loading" | "audio" | "vocab" | "quiz" | "results" | "error">("loading");
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<Set<number>>(new Set());
  const [hintVisible, setHintVisible] = useState(false);
  const [finalCoinsEarned, setFinalCoinsEarned] = useState(0);
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [vocabPlayingIdx, setVocabPlayingIdx] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pronunciationSoundRef = useRef<Audio.Sound | null>(null);
  const selfSoundRef = useRef<Audio.Sound | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isLangLesson = ["french", "spanish", "maltese", "italian"].includes(params.subject ?? "");

  const generateMutation = useGenerateLesson({
    mutation: {
      onSuccess: (data) => {
        const l = data as unknown as Lesson;
        setLesson(l);
        const isLang = ["french", "spanish", "maltese", "italian"].includes(params.subject ?? "");
        if (isLang && (l.vocabulary?.length ?? 0) > 0) {
          setPhase("vocab");
        } else if (l.audioText && params.exerciseType === "listening") {
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

  const pronounceMutation = useTextToSpeech({
    mutation: {
      onSuccess: async (data) => {
        try {
          await pronunciationSoundRef.current?.unloadAsync();
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
          const { sound } = await Audio.Sound.createAsync(
            { uri: `data:audio/mp3;base64,${data.audio}` },
            { shouldPlay: true }
          );
          pronunciationSoundRef.current = sound;
          setIsPronouncing(true);
          sound.setOnPlaybackStatusUpdate((status) => {
            if ("didJustFinish" in status && status.didJustFinish) {
              setIsPronouncing(false);
            }
          });
        } catch {
          setIsPronouncing(false);
        }
      },
      onError: () => setIsPronouncing(false),
    },
  });

  const langSection = params.languageSection ? Number(params.languageSection) : undefined;

  useEffect(() => {
    setLesson(null);
    setCurrentQ(0);
    setAnswers({});
    setSubmitted({});
    setTextInput("");
    setMatchSelected(null);
    setMatchedPairs([]);
    setPhase("loading");
    setScore(0);
    setHintsUsed(new Set());
    setHintVisible(false);
    setFinalCoinsEarned(0);
    setRecordingUri(null);
    setVocabPlayingIdx(null);
    progressAnim.setValue(0);
    generateMutation.mutate({
      data: {
        subject: (params.subject ?? "math") as GenerateLessonBodySubject,
        exerciseType: params.exerciseType !== "auto" ? (params.exerciseType ?? undefined) : undefined,
        level: Number(params.level) || 5,
        languageSection: langSection,
      },
    });
    return () => {
      soundRef.current?.unloadAsync();
      pronunciationSoundRef.current?.unloadAsync();
      selfSoundRef.current?.unloadAsync();
    };
  }, [params.subject, params.exerciseType, params.level, params.languageSection]);

  useEffect(() => {
    if (phase === "audio" && lesson?.audioText) {
      ttsMutation.mutate({ data: { text: lesson.audioText, voice: "nova" } });
    }
  }, [phase]);

  // Auto-pronounce target-language word when question changes (language lessons)
  useEffect(() => {
    if (phase === "quiz" && isLangLesson) {
      const text = lesson?.questions[currentQ]?.speakText ?? lesson?.questions[currentQ]?.correctAnswer;
      if (text) {
        const timer = setTimeout(() => {
          pronounceMutation.mutate({ data: { text, voice: "nova" } });
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [currentQ, phase]);

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
                  exerciseType: params.exerciseType !== "auto" ? (params.exerciseType ?? undefined) : undefined,
                  level: Number(params.level) || 5,
                  languageSection: langSection,
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

  // ── Vocabulary intro ──
  if (phase === "vocab") {
    const vocab = lesson?.vocabulary ?? [];
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.vocabHeader, { backgroundColor: colors.primary }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.vocabHeaderTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              New Words
            </Text>
            <Text style={[styles.vocabHeaderSub, { color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" }]}>
              {lesson?.title ?? "Vocabulary"}
            </Text>
          </View>
          <View style={[styles.vocabBadge, { backgroundColor: colors.gold }]}>
            <Text style={[styles.vocabBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              {vocab.length} words
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.vocabContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.vocabIntro, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Study these words before your quiz. Tap the speaker to hear how they sound.
          </Text>

          {vocab.map((item, idx) => {
            const isPlaying = vocabPlayingIdx === idx && isPronouncing;
            return (
              <View
                key={idx}
                style={[
                  styles.vocabCard,
                  {
                    backgroundColor: isPlaying ? colors.primary + "0D" : colors.card,
                    borderColor: isPlaying ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.vocabWord, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {item.word}
                  </Text>
                  <Text style={[styles.vocabPhonetic, { color: colors.gold, fontFamily: "Inter_400Regular" }]}>
                    {item.pronunciation}
                  </Text>
                  <Text style={[styles.vocabMeaning, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {item.meaning}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.vocabSpeakBtn,
                    { backgroundColor: isPlaying ? colors.primary : colors.primary + "14" },
                  ]}
                  onPress={() => {
                    setVocabPlayingIdx(idx);
                    pronounceMutation.mutate({ data: { text: item.word, voice: "nova" } });
                  }}
                  disabled={isPronouncing && !isPlaying}
                >
                  <Feather
                    name={isPlaying ? "volume-2" : "volume-1"}
                    size={20}
                    color={isPlaying ? "#fff" : colors.primary}
                  />
                </Pressable>
              </View>
            );
          })}
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.vocabFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setVocabPlayingIdx(null);
              pronunciationSoundRef.current?.unloadAsync();
              setPhase("quiz");
            }}
          >
            <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              Start Quiz
            </Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Results ──
  if (phase === "results") {
    const total = lesson?.questions.length ?? 0;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = pct >= 60;
    const emoji = pct === 100 ? "🏆" : pct >= 80 ? "⭐" : pct >= 60 ? "👍" : "💪";
    const hintsCount = hintsUsed.size;
    const baseCoins = Math.max(10, Math.round((pct / 100) * 50));
    const hintPenalty = hintsCount * 5;
    const displayCoins = finalCoinsEarned || Math.max(5, baseCoins - hintPenalty);

    const handleStartNext = () => {
      router.replace({
        pathname: "/(tabs)/lesson",
        params: {
          subject: params.subject ?? "",
          exerciseType: "auto",
          level: String(params.level ?? 1),
          languageSection: String((langSection ?? 1) + 1),
        },
      } as Parameters<typeof router.replace>[0]);
    };

    const handleContinue = () => {
      router.back();
    };

    const handleRetry = () => {
      setPhase("loading");
      setCurrentQ(0);
      setAnswers({});
      setSubmitted({});
      setScore(0);
      setHintsUsed(new Set());
      setHintVisible(false);
      setFinalCoinsEarned(0);
      setMatchedPairs([]);
      progressAnim.setValue(0);
      generateMutation.mutate({
        data: {
          subject: (params.subject ?? "math") as GenerateLessonBodySubject,
          exerciseType: params.exerciseType !== "auto" ? (params.exerciseType ?? undefined) : undefined,
          level: Number(params.level) || 5,
          languageSection: langSection,
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
              <View style={{ flex: 1 }}>
                <Text style={[styles.coinsEarnedText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  +{displayCoins} coins earned!
                </Text>
                {hintsCount > 0 ? (
                  <Text style={[styles.coinsSubText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Base {baseCoins} − {hintPenalty} hint {hintsCount === 1 ? "penalty" : "penalties"}
                  </Text>
                ) : (
                  <Text style={[styles.coinsSubText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    No hints used — full reward! 🎉
                  </Text>
                )}
              </View>
            </View>

            {/* Hint summary */}
            {hintsCount > 0 && (
              <View style={[styles.hintSummary, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "50" }]}>
                <Text style={{ fontSize: 18 }}>💡</Text>
                <Text style={[styles.hintSummaryText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                  You used {hintsCount} hint{hintsCount > 1 ? "s" : ""} this lesson.
                  Each hint reduces your reward by 5 coins.
                </Text>
              </View>
            )}

            {/* Answer review */}
            {lesson?.questions && lesson.questions.length > 0 && (
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  Answer Review
                </Text>
                {lesson.questions.map((q, idx) => {
                  const userAns = answers[idx] ?? "";
                  const wasCorrect = userAns.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                  const usedHint = hintsUsed.has(idx);
                  return (
                    <View key={idx} style={[styles.reviewItem, { backgroundColor: colors.card, borderColor: wasCorrect ? colors.correct + "60" : colors.wrong + "60" }]}>
                      <View style={styles.reviewItemTop}>
                        <View style={[styles.reviewDot, { backgroundColor: wasCorrect ? colors.correct : colors.wrong }]}>
                          <Feather name={wasCorrect ? "check" : "x"} size={10} color="#fff" />
                        </View>
                        <Text style={[styles.reviewQ, { color: colors.primary, fontFamily: "Inter_500Medium" }]} numberOfLines={2}>
                          {q.question}
                        </Text>
                        {usedHint && (
                          <Text style={{ fontSize: 14 }}>💡</Text>
                        )}
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
            {isLangLesson && passed && langSection && langSection < 18 ? (
              <>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.correct }]}
                  onPress={handleStartNext}
                >
                  <Feather name="arrow-right" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                    Start Next Section
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.retryBtn, { borderColor: colors.border }]}
                  onPress={handleContinue}
                >
                  <Feather name="list" size={16} color={colors.primary} />
                  <Text style={[styles.retryBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    Back to Sections
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleContinue}
                >
                  <Feather name="book-open" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                    {isLangLesson ? "Back to Sections" : "Continue Learning"}
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
              </>
            )}
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
    setHintVisible(false);
    setRecordingUri(null);
    setIsRecording(false);
    setRecordingObj(null);
    if (currentQ === questions.length - 1) {
      const finalPct = Math.round((score / questions.length) * 100);
      const baseCoins = Math.max(10, Math.round((finalPct / 100) * 50));
      const hintPenalty = hintsUsed.size * 5;
      const coins = Math.max(5, baseCoins - hintPenalty);
      setFinalCoinsEarned(coins);
      earnCoinsMutation.mutate({ data: { amount: coins } });
      sendLessonCompleteNotification(coins);
      saveProgressMutation.mutate({
        data: {
          subject: params.subject ?? "math",
          level: Number(params.level) || 5,
          score: finalPct,
          exerciseType: params.exerciseType !== "auto" ? (params.exerciseType ?? "mixed") : "mixed",
          languageSection: langSection,
        },
      });
      setPhase("results");
    } else {
      setCurrentQ((c) => c + 1);
    }
  };

  // ── Recording helpers ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecordingObj(recording);
      setIsRecording(true);
    } catch {}
  };

  const stopRecording = async () => {
    if (!recordingObj) return;
    try {
      await recordingObj.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const uri = recordingObj.getURI();
      setRecordingUri(uri ?? null);
      setRecordingObj(null);
      setIsRecording(false);
    } catch { setIsRecording(false); }
  };

  const playOwnRecording = async () => {
    if (!recordingUri) return;
    try {
      await selfSoundRef.current?.unloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri }, { shouldPlay: true });
      selfSoundRef.current = sound;
    } catch {}
  };

  const resetRecording = () => {
    setRecordingUri(null);
    setIsRecording(false);
    setRecordingObj(null);
  };

  const handleSpeakSubmit = (gotIt: boolean) => {
    const q = lesson?.questions[currentQ];
    if (!q) return;
    const answer = gotIt ? q.correctAnswer : "";
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
    setSubmitted((prev) => ({ ...prev, [currentQ]: true }));
    if (gotIt) setScore((s) => s + 1);
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
        : q.type === "speak"
          ? false  // speak uses self-assessment buttons, not Check Answer
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

        {/* Pronunciation button (language lessons) */}
        {isLangLesson && (q.speakText || q.correctAnswer) && (
          <Pressable
            style={[
              styles.pronounceBtn,
              {
                borderColor: isPronouncing ? colors.primary : colors.primary + "50",
                backgroundColor: isPronouncing ? colors.primary + "15" : "transparent",
              },
            ]}
            onPress={() => {
              const text = q.speakText ?? q.correctAnswer;
              pronounceMutation.mutate({ data: { text, voice: "nova" } });
            }}
            disabled={isPronouncing || pronounceMutation.isPending}
          >
            <Feather
              name={isPronouncing ? "volume-2" : "volume-1"}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.pronounceBtnText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              {isPronouncing ? "Playing..." : "Hear it 🔊"}
            </Text>
          </Pressable>
        )}

        {/* Hint button — only show if hint available and not submitted */}
        {q.hint && !isSubmitted && (
          <View style={styles.hintArea}>
            {!hintVisible ? (
              <Pressable
                style={[styles.hintBtn, { borderColor: colors.gold, backgroundColor: colors.gold + "12" }]}
                onPress={() => {
                  setHintVisible(true);
                  setHintsUsed((prev) => new Set([...prev, currentQ]));
                }}
              >
                <Text style={{ fontSize: 15 }}>💡</Text>
                <Text style={[styles.hintBtnText, { color: "#B8860B", fontFamily: "Inter_600SemiBold" }]}>
                  Show Hint {hintsUsed.has(currentQ) ? "" : "(-5 coins)"}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.hintCard, { backgroundColor: "#FFF8E1", borderColor: colors.gold }]}>
                <View style={styles.hintCardTop}>
                  <Text style={{ fontSize: 16 }}>💡</Text>
                  <Text style={[styles.hintCardLabel, { color: "#B8860B", fontFamily: "Inter_700Bold" }]}>Hint</Text>
                  <Text style={[styles.hintPenaltyTag, { color: "#B8860B", fontFamily: "Inter_400Regular" }]}>
                    −5 coins
                  </Text>
                </View>
                <Text style={[styles.hintCardText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                  {q.hint}
                </Text>
              </View>
            )}
          </View>
        )}

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

        {/* Speak exercise */}
        {q.type === "speak" && (
          <View style={styles.speakSection}>
            {/* Word card */}
            <View style={[styles.speakWordCard, { backgroundColor: colors.primary + "0E", borderColor: colors.primary + "30" }]}>
              <Text style={[styles.speakWordLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Say this in the target language:
              </Text>
              <Text style={[styles.speakWord, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {q.correctAnswer}
              </Text>
            </View>

            {/* Record / playback */}
            {!isSubmitted && (
              <>
                {!recordingUri ? (
                  <Pressable
                    style={[
                      styles.recordBtn,
                      {
                        backgroundColor: isRecording ? colors.wrong : colors.gold,
                        shadowColor: isRecording ? colors.wrong : colors.gold,
                      },
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Feather name={isRecording ? "square" : "mic"} size={22} color={isRecording ? "#fff" : "#1B3A6B"} />
                    <Text style={[styles.recordBtnText, { color: isRecording ? "#fff" : "#1B3A6B", fontFamily: "Inter_600SemiBold" }]}>
                      {isRecording ? "Stop Recording" : "🎤 Record Yourself"}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.playbackRow}>
                    <Pressable
                      style={[styles.playbackBtn, { backgroundColor: colors.card, borderColor: colors.primary + "50" }]}
                      onPress={playOwnRecording}
                    >
                      <Feather name="play" size={14} color={colors.primary} />
                      <Text style={[styles.playbackBtnText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Play Mine</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.playbackBtn, { backgroundColor: colors.card, borderColor: colors.primary + "50" }]}
                      onPress={() => {
                        const text = q.speakText ?? q.correctAnswer;
                        pronounceMutation.mutate({ data: { text, voice: "nova" } });
                      }}
                    >
                      <Feather name="volume-2" size={14} color={colors.primary} />
                      <Text style={[styles.playbackBtnText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Play Correct</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.playbackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={resetRecording}
                    >
                      <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.playbackBtnText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Retry</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}

            {/* Self-assessment (after recording) */}
            {recordingUri && !isSubmitted && (
              <View style={styles.speakAssessRow}>
                <Pressable
                  style={[styles.gotItBtn, { backgroundColor: colors.correct }]}
                  onPress={() => handleSpeakSubmit(true)}
                >
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={[styles.gotItBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>I got it! ✅</Text>
                </Pressable>
                <Pressable
                  style={[styles.needPracticeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => handleSpeakSubmit(false)}
                >
                  <Text style={[styles.needPracticeBtnText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Need more practice
                  </Text>
                </Pressable>
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
            q.type === "speak" ? null : (
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
            )
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

  vocabHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  vocabHeaderTitle: { fontSize: 20 },
  vocabHeaderSub: { fontSize: 13, marginTop: 1 },
  vocabBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  vocabBadgeText: { fontSize: 12 },
  vocabContent: { padding: 20, gap: 12 },
  vocabIntro: { fontSize: 14, lineHeight: 21, marginBottom: 4 },
  vocabCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    padding: 16, borderRadius: 16, borderWidth: 1.5,
  },
  vocabWord: { fontSize: 22 },
  vocabPhonetic: { fontSize: 13, fontStyle: "italic" },
  vocabMeaning: { fontSize: 15 },
  vocabSpeakBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  vocabFooter: {
    padding: 20, paddingBottom: 24, borderTopWidth: 1,
  },

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

  hintArea: { marginBottom: 16 },
  hintBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5,
    alignSelf: "flex-start",
  },
  hintBtnText: { fontSize: 14 },
  hintCard: {
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderLeftWidth: 4, gap: 6,
  },
  hintCardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  hintCardLabel: { fontSize: 13, flex: 1 },
  hintPenaltyTag: { fontSize: 12 },
  hintCardText: { fontSize: 14, lineHeight: 21 },

  hintSummary: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 16,
  },
  hintSummaryText: { flex: 1, fontSize: 13, lineHeight: 20 },

  pronounceBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    borderWidth: 1.5, alignSelf: "flex-start", marginBottom: 14,
  },
  pronounceBtnText: { fontSize: 13 },

  speakSection: { gap: 16, marginBottom: 8 },
  speakWordCard: {
    padding: 18, borderRadius: 18, borderWidth: 1.5,
    alignItems: "center", gap: 8,
  },
  speakWordLabel: { fontSize: 12, textAlign: "center" },
  speakWord: { fontSize: 22, textAlign: "center", lineHeight: 30 },
  recordBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 16,
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  recordBtnText: { fontSize: 16 },
  playbackRow: { flexDirection: "row", gap: 8 },
  playbackBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
  },
  playbackBtnText: { fontSize: 13 },
  speakAssessRow: { gap: 10 },
  gotItBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
    shadowColor: "#16A34A", shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  gotItBtnText: { fontSize: 16 },
  needPracticeBtn: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
  },
  needPracticeBtnText: { fontSize: 14 },

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
