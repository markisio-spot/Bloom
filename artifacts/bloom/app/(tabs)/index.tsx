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

const SUBJECTS = [
  { key: "math", label: "Math", icon: "hash" as const, color: "#4F46E5" },
  { key: "languages", label: "Languages", icon: "globe" as const, color: "#0891B2" },
  { key: "grammar", label: "Grammar", icon: "type" as const, color: "#7C3AED" },
  { key: "history", label: "History", icon: "clock" as const, color: "#B45309" },
  { key: "geography", label: "Geography", icon: "map" as const, color: "#065F46" },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token, user, updateUser } = useAuth();
  const hasCheckedIn = useRef(false);

  const { data: me, isLoading: meLoading, refetch: refetchMe } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
    },
  });

  const { data: progress } = useGetProgress({
    query: {
      enabled: !!token,
      queryKey: getGetProgressQueryKey(),
    },
  });

  const { data: challenge, isLoading: challengeLoading, refetch: refetchChallenge } = useGetDailyChallenge({
    query: {
      enabled: !!token,
      queryKey: getGetDailyChallengeQueryKey(),
    },
  });

  const streakMutation = useCheckInStreak({
    mutation: {
      onSuccess: (data) => {
        updateUser({ streakCount: data.streakCount });
      },
    },
  });

  useEffect(() => {
    if (token && !hasCheckedIn.current) {
      hasCheckedIn.current = true;
      streakMutation.mutate(undefined);
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
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                Good day,
              </Text>
              <Text style={[styles.displayName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                {displayUser?.displayName ?? "Learner"}
              </Text>
            </View>
            <View style={[styles.coinsBadge, { backgroundColor: "rgba(245,197,24,0.2)" }]}>
              <Feather name="star" size={16} color={colors.gold} />
              <Text style={[styles.coinsText, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
                {displayUser?.coins ?? 0}
              </Text>
            </View>
          </View>

          <View style={styles.streakRow}>
            <View style={[styles.streakItem, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Feather name="zap" size={18} color={colors.gold} />
              <Text style={[styles.streakCount, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                {displayUser?.streakCount ?? 0}
              </Text>
              <Text style={[styles.streakLabel, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                day streak
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Daily Challenge Card */}
          {!challengeLoading && challenge && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                Daily Challenge
              </Text>
              <Pressable
                style={[
                  styles.challengeCard,
                  {
                    backgroundColor: challenge.completed ? colors.card : colors.primary,
                    borderColor: challenge.completed ? colors.border : colors.primary,
                  },
                ]}
                onPress={() => !challenge.completed && router.push("/daily-challenge")}
              >
                <View style={styles.challengeLeft}>
                  <View style={[styles.challengeIcon, { backgroundColor: challenge.completed ? colors.border : "rgba(255,255,255,0.15)" }]}>
                    <Feather
                      name={challenge.completed ? "check-circle" : "zap"}
                      size={22}
                      color={challenge.completed ? colors.correct : colors.gold}
                    />
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={[
                      styles.challengeTitle,
                      {
                        color: challenge.completed ? colors.primary : "#fff",
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}>
                      {challenge.title}
                    </Text>
                    <Text style={[
                      styles.challengeSubject,
                      {
                        color: challenge.completed ? colors.mutedForeground : "rgba(255,255,255,0.7)",
                        fontFamily: "Inter_400Regular",
                      },
                    ]}>
                      {challenge.description}
                    </Text>
                  </View>
                </View>
                {!challenge.completed && (
                  <View style={[styles.rewardBadge, { backgroundColor: colors.gold }]}>
                    <Feather name="star" size={12} color={colors.primary} />
                    <Text style={[styles.rewardText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                      {challenge.coinReward}
                    </Text>
                  </View>
                )}
                {challenge.completed && (
                  <Text style={[styles.completedLabel, { color: colors.correct, fontFamily: "Inter_600SemiBold" }]}>
                    Done
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Subjects */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              Subjects
            </Text>
            <View style={styles.subjectGrid}>
              {SUBJECTS.map((subject) => (
                <Pressable
                  key={subject.key}
                  style={[
                    styles.subjectCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => router.push(`/(tabs)/learn?subject=${subject.key}`)}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: subject.color + "18" }]}>
                    <Feather name={subject.icon} size={24} color={subject.color} />
                  </View>
                  <Text style={[styles.subjectLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {subject.label}
                  </Text>
                  <Text style={[styles.subjectLevel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Level {levelFor(subject.key)}
                  </Text>
                </Pressable>
              ))}
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
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinsText: { fontSize: 16 },
  streakRow: { marginTop: 16 },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  streakCount: { fontSize: 18 },
  streakLabel: { fontSize: 13 },
  body: { padding: 20, gap: 28 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18 },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  challengeLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeInfo: { flex: 1, gap: 2 },
  challengeTitle: { fontSize: 15 },
  challengeSubject: { fontSize: 12 },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rewardText: { fontSize: 14 },
  completedLabel: { fontSize: 13 },
  subjectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  subjectCard: {
    width: "47%",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 8,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectLabel: { fontSize: 16 },
  subjectLevel: { fontSize: 12 },
});
