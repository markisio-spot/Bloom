import { Feather } from "@expo/vector-icons";
import {
  useCheckInStreak,
  useGetDailyChallenge,
  useGetMe,
  useGetProgress,
  getGetMeQueryKey,
  getGetProgressQueryKey,
  getGetDailyChallengeQueryKey,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { scheduleStreakReminder } from "@/utils/notifications";
import CoinIcon from "@/components/CoinIcon";

const SUBJECTS = [
  { key: "math",      label: "Math",      emoji: "🔢", color: "#4F46E5" },
  { key: "languages", label: "Languages", emoji: "🌍", color: "#0891B2" },
  { key: "grammar",   label: "Grammar",   emoji: "📝", color: "#7C3AED" },
  { key: "history",   label: "History",   emoji: "📜", color: "#B45309" },
  { key: "geography", label: "Geography", emoji: "🗺️",  color: "#065F46" },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token, user, updateUser } = useAuth();
  const hasCheckedIn = useRef(false);

  const { data: me, isLoading: meLoading, refetch: refetchMe } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  const { data: progress } = useGetProgress({
    query: { enabled: !!token, queryKey: getGetProgressQueryKey() },
  });

  const { data: challenge, isLoading: challengeLoading, refetch: refetchChallenge } = useGetDailyChallenge({
    query: { enabled: !!token, queryKey: getGetDailyChallengeQueryKey() },
  });

  const streakMutation = useCheckInStreak({
    mutation: {
      onSuccess: (data) => { updateUser({ streakCount: data.streakCount }); },
    },
  });

  useEffect(() => {
    if (token && !hasCheckedIn.current) {
      hasCheckedIn.current = true;
      streakMutation.mutate(undefined);
      scheduleStreakReminder();
    }
  }, [token]);

  const displayUser = me ?? user;
  const isLoading = meLoading && !displayUser;

  const handleRefresh = async () => {
    await Promise.all([refetchMe(), refetchChallenge()]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const levelFor = (subject: string) => {
    const p = progress?.find((pr) => pr.subject === subject);
    return p?.currentLevel ?? 1;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
      >
        {/* ── Navy Header ── */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" }]}>
                Good day,
              </Text>
              <Text style={[styles.displayName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                {displayUser?.displayName ?? "Learner"} 👋
              </Text>
            </View>
            <View style={[styles.coinsBadge, { backgroundColor: "rgba(245,197,24,0.18)" }]}>
              <CoinIcon size={20} count={displayUser?.coins ?? 0} textStyle={{ color: "#F5C518", fontSize: 15 }} />
            </View>
          </View>

          <View style={styles.streakRow}>
            <View style={[styles.streakItem, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Feather name="zap" size={16} color={colors.gold} />
              <Text style={[styles.streakCount, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                {displayUser?.streakCount ?? 0}
              </Text>
              <Text style={[styles.streakLabel, { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" }]}>
                day streak
              </Text>
            </View>
            {(displayUser?.streakFreezes ?? 0) > 0 && (
              <View style={[styles.streakItem, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                <Text style={{ fontSize: 14 }}>🛡️</Text>
                <Text style={[styles.streakCount, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  {displayUser?.streakFreezes}
                </Text>
                <Text style={[styles.streakLabel, { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" }]}>
                  {displayUser?.streakFreezes === 1 ? "freeze" : "freezes"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* ── Daily Challenge ── */}
          {!challengeLoading && challenge && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                ⚡ Daily Challenge
              </Text>

              {challenge.completed ? (
                /* Completed state */
                <View style={[styles.challengeCard, { backgroundColor: colors.correct + "12", borderColor: colors.correct, borderWidth: 2 }]}>
                  <View style={styles.challengeLeft}>
                    <View style={[styles.challengeIcon, { backgroundColor: colors.correct + "20" }]}>
                      <Feather name="check-circle" size={26} color={colors.correct} />
                    </View>
                    <View style={styles.challengeInfo}>
                      <Text style={[styles.challengeTitle, { color: colors.correct, fontFamily: "Inter_700Bold" }]}>
                        Challenge Completed! 🎉
                      </Text>
                      <Text style={[styles.challengeSubject, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        Come back tomorrow for a new one
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.doneBadge, { backgroundColor: colors.correct }]}>
                    <Feather name="check" size={12} color="#fff" />
                    <Text style={[styles.doneBadgeText, { fontFamily: "Inter_700Bold" }]}>Done</Text>
                  </View>
                </View>
              ) : (
                /* Active state */
                <Pressable
                  style={({ pressed }) => [
                    styles.challengeCard,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      transform: [{ translateY: pressed ? 2 : 0 }],
                    },
                  ]}
                  onPress={() => router.push("/daily-challenge")}
                >
                  <View style={[styles.challengeShadow, { backgroundColor: "#0D2244" }]} />
                  <View style={styles.challengeLeft}>
                    <View style={[styles.challengeIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                      <Feather name="zap" size={24} color={colors.gold} />
                    </View>
                    <View style={styles.challengeInfo}>
                      <Text style={[styles.challengeTitle, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                        {challenge.title}
                      </Text>
                      <Text style={[styles.challengeSubject, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                        {challenge.description}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.rewardBadge, { backgroundColor: "rgba(245,197,24,0.18)" }]}>
                    <CoinIcon size={14} count={challenge.coinReward} textStyle={{ color: colors.gold, fontSize: 13 }} />
                  </View>
                </Pressable>
              )}
            </View>
          )}

          {/* ── Subjects ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              📚 Subjects
            </Text>
            <View style={styles.subjectList}>
              {SUBJECTS.map((subject) => {
                const level = levelFor(subject.key);
                return (
                  <Pressable
                    key={subject.key}
                    style={({ pressed }) => [
                      styles.subjectCard,
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
                    <View style={[styles.cardShadow, { backgroundColor: colors.primary }]} />
                    <View style={styles.cardInner}>
                      <View style={[styles.iconWrap, { backgroundColor: subject.color, borderColor: subject.color + "60" }]}>
                        <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                          {subject.label}
                        </Text>
                        <View style={[styles.levelBadge, { backgroundColor: subject.color }]}>
                          <Text style={[styles.levelText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                            Lv {level}
                          </Text>
                        </View>
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.primary} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { fontSize: 13 },
  displayName: { fontSize: 24, marginTop: 2 },
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakRow: { marginTop: 16, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  streakCount: { fontSize: 17 },
  streakLabel: { fontSize: 13 },
  body: { paddingHorizontal: 20, paddingTop: 24, gap: 28, paddingBottom: 120 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 19 },

  // Daily challenge card
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    position: "relative",
    overflow: "hidden",
  },
  challengeShadow: {
    position: "absolute",
    bottom: -4, left: 4, right: -4,
    height: "100%",
    borderRadius: 20,
    zIndex: 0,
  },
  challengeLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, zIndex: 1 },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeInfo: { flex: 1, gap: 3 },
  challengeTitle: { fontSize: 15 },
  challengeSubject: { fontSize: 12 },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 1,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  doneBadgeText: { color: "#fff", fontSize: 12 },

  // Subject cards — same style as Learn screen
  subjectList: { gap: 12 },
  subjectCard: {
    borderRadius: 20,
    borderWidth: 2.5,
    position: "relative",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardShadow: {
    position: "absolute",
    bottom: -4, left: 2, right: -2,
    height: "100%",
    borderRadius: 20,
    zIndex: 0,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
    borderRadius: 18,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1.5,
  },
  subjectEmoji: { fontSize: 24 },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 16 },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelText: { fontSize: 11 },
});
