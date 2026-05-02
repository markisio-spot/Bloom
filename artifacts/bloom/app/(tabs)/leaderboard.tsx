import { Feather } from "@expo/vector-icons";
import {
  useGetLeaderboard,
  useGetFriendsLeaderboard,
  getGetLeaderboardQueryKey,
  getGetFriendsLeaderboardQueryKey,
} from "@workspace/api-client-react";
import React, { useState } from "react";
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
import CoinIcon from "@/components/CoinIcon";
import { CartoonAvatarHead, DEFAULT_AVATAR, type AvatarData } from "@/components/CartoonAvatar";

interface LeaderboardEntry {
  userId: number;
  displayName: string;
  avatarData: string | null;
  coins: number;
  streakCount: number;
  animalCount: number;
  animals: Array<{ id: number; name: string; emoji: string; rarity: string }>;
}

function parseAvatar(raw: string | null | undefined): AvatarData {
  if (!raw) return DEFAULT_AVATAR;
  try { return { ...DEFAULT_AVATAR, ...(JSON.parse(raw) as Partial<AvatarData>) }; }
  catch { return DEFAULT_AVATAR; }
}

function AvatarHead({ avatarData, size = 44 }: { avatarData?: string | null; size?: number }) {
  const colors = useColors();
  const avatar = parseAvatar(avatarData);
  return (
    <View style={[styles.avatarRing, { width: size, height: size, borderRadius: size / 2, borderColor: colors.primary }]}>
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
        <CartoonAvatarHead avatar={avatar} size={size} />
      </View>
    </View>
  );
}

const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];

function LeaderboardList({ entries, isLoading, refetch, user }: {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  refetch: () => void;
  user: { id: number } | null;
}) {
  const colors = useColors();
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 52 }}>🏆</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          No entries yet. Start collecting animals!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      contentContainerStyle={styles.content}
    >
      {/* ── Podium ── */}
      {topThree.length > 0 && (
        <View style={[styles.podiumCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.podiumCardShadow]} />
          <Text style={[styles.podiumTitle, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_600SemiBold" }]}>
            🏆 Top Collectors
          </Text>
          <View style={styles.podiumRow}>
            {/* Reorder: 2nd, 1st, 3rd */}
            {[topThree[1], topThree[0], topThree[2]].map((entry, displayIdx) => {
              const actualIdx = [1, 0, 2][displayIdx]!;
              if (!entry) return <View key={displayIdx} style={styles.podiumItem} />;
              const podiumSize = actualIdx === 0 ? 68 : 52;
              return (
                <View key={entry.userId} style={[styles.podiumItem, actualIdx === 0 && styles.podiumCenter]}>
                  <View style={{ position: "relative" }}>
                    <AvatarHead avatarData={entry.avatarData} size={podiumSize} />
                    <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[actualIdx] }]}>
                      <Text style={[styles.rankNum, { fontFamily: "Inter_700Bold" }]}>{actualIdx + 1}</Text>
                    </View>
                  </View>
                  <Text style={[styles.podiumName, { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: actualIdx === 0 ? 14 : 12 }]} numberOfLines={1}>
                    {entry.displayName}
                  </Text>
                  <View style={styles.podiumStats}>
                    <CoinIcon size={12} count={entry.coins} textStyle={{ color: colors.gold, fontSize: 11 }} />
                    <View style={styles.podiumStatDivider} />
                    <Text style={[styles.podiumStatText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
                      🐾 {entry.animalCount}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Ranked list ── */}
      <View style={styles.listSection}>
        {rest.map((entry, idx) => {
          const rank = idx + 4;
          const isMe = entry.userId === user?.id;
          return (
            <View key={entry.userId} style={[
              styles.entryRow,
              {
                backgroundColor: isMe ? colors.primary + "12" : colors.card,
                borderColor: isMe ? colors.primary : colors.border,
                shadowColor: colors.primary,
              },
            ]}>
              <View style={[styles.entryRowShadow, { backgroundColor: colors.primary, opacity: 0.15 }]} />
              <Text style={[styles.rankText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>#{rank}</Text>
              <AvatarHead avatarData={entry.avatarData} size={44} />
              <View style={styles.entryInfo}>
                <Text style={[styles.entryName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {entry.displayName}{isMe ? " 👈" : ""}
                </Text>
                <View style={styles.entryStats}>
                  <CoinIcon size={13} count={entry.coins} textStyle={{ color: colors.mutedForeground, fontSize: 12 }} />
                  <View style={[styles.dotDivider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    🐾 {entry.animalCount}
                  </Text>
                  {entry.streakCount > 0 && (
                    <>
                      <View style={[styles.dotDivider, { backgroundColor: colors.border }]} />
                      <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        ⚡ {entry.streakCount}d
                      </Text>
                    </>
                  )}
                </View>
                {entry.animals.length > 0 && (
                  <View style={styles.animalPreview}>
                    {entry.animals.slice(0, 5).map((a) => (
                      <Text key={a.id} style={styles.previewEmoji}>{a.emoji}</Text>
                    ))}
                    {entry.animalCount > 5 && (
                      <Text style={[styles.moreAnimals, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        +{entry.animalCount - 5}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const { user, token } = useAuth();
  const [tab, setTab] = useState<"global" | "friends">("global");

  const { data: globalEntries = [], isLoading: globalLoading, refetch: refetchGlobal } = useGetLeaderboard({
    query: { queryKey: getGetLeaderboardQueryKey() },
  });

  const { data: friendEntries = [], isLoading: friendLoading, refetch: refetchFriends } = useGetFriendsLeaderboard({
    query: {
      enabled: !!token && tab === "friends",
      queryKey: getGetFriendsLeaderboardQueryKey(),
    },
  });

  const entries = tab === "global" ? (globalEntries as LeaderboardEntry[]) : (friendEntries as LeaderboardEntry[]);
  const isLoading = tab === "global" ? globalLoading : friendLoading;
  const refetch = tab === "global" ? refetchGlobal : refetchFriends;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          🏆 Leaderboard
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Ranked by animal collection
        </Text>

        {/* Tab switcher */}
        <View style={[styles.tabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={[styles.tabBtn, tab === "global" && { backgroundColor: colors.primary }]}
            onPress={() => setTab("global")}
          >
            <Text style={[styles.tabText, { color: tab === "global" ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              🌍 Global
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === "friends" && { backgroundColor: colors.primary }]}
            onPress={() => setTab("friends")}
          >
            <Text style={[styles.tabText, { color: tab === "friends" ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              👫 Friends
            </Text>
          </Pressable>
        </View>
      </View>

      <LeaderboardList entries={entries} isLoading={isLoading} refetch={refetch} user={user} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 4 },
  title: { fontSize: 30 },
  subtitle: { fontSize: 14, marginTop: 2, marginBottom: 8 },
  tabRow: {
    flexDirection: "row", borderRadius: 16, borderWidth: 1.5,
    overflow: "hidden", alignSelf: "flex-start", marginTop: 4,
  },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  tabText: { fontSize: 14 },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  podiumCard: { borderRadius: 28, padding: 22, marginBottom: 20, position: "relative", overflow: "hidden" },
  podiumCardShadow: {
    position: "absolute", bottom: -4, left: 4, right: -4,
    height: "100%", borderRadius: 28, backgroundColor: "#0D2244", zIndex: -1,
  },
  podiumTitle: { fontSize: 13, marginBottom: 18, textAlign: "center" },
  podiumRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 18 },
  podiumItem: { alignItems: "center", gap: 6, width: 84 },
  podiumCenter: { marginBottom: 14 },
  rankBadge: {
    position: "absolute", bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  rankNum: { color: "#fff", fontSize: 11 },
  podiumName: { textAlign: "center" },
  podiumStats: { flexDirection: "row", alignItems: "center", gap: 5 },
  podiumStatDivider: { width: 1, height: 10, backgroundColor: "rgba(255,255,255,0.3)" },
  podiumStatText: { fontSize: 11 },
  avatarRing: { borderWidth: 2.5, overflow: "hidden" },
  listSection: { gap: 10 },
  entryRow: {
    flexDirection: "row", alignItems: "center",
    padding: 12, borderRadius: 18, borderWidth: 2.5, gap: 10,
    position: "relative", overflow: "hidden",
  },
  entryRowShadow: {
    position: "absolute", bottom: -3, left: 3, right: -3,
    height: "100%", borderRadius: 18, zIndex: -1,
  },
  rankText: { fontSize: 14, minWidth: 32 },
  entryInfo: { flex: 1, gap: 3 },
  entryName: { fontSize: 15 },
  entryStats: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  dotDivider: { width: 3, height: 3, borderRadius: 1.5 },
  statText: { fontSize: 12 },
  animalPreview: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 3 },
  previewEmoji: { fontSize: 18 },
  moreAnimals: { fontSize: 12, marginLeft: 4 },
  empty: { alignItems: "center", gap: 14, paddingTop: 60 },
  emptyText: { fontSize: 15, textAlign: "center", maxWidth: 260 },
});
