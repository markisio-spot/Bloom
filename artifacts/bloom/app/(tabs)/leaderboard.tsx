import { Feather } from "@expo/vector-icons";
import {
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
} from "@workspace/api-client-react";
import React from "react";
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

const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];
const RANK_ICONS: Record<number, "award"> = { 0: "award", 1: "award", 2: "award" };

interface LeaderboardEntry {
  userId: number;
  displayName: string;
  avatarData: string | null;
  coins: number;
  streakCount: number;
  animalCount: number;
  animals: Array<{ id: number; name: string; emoji: string; rarity: string }>;
}

function AvatarCircle({ displayName, avatarData, size = 44 }: { displayName: string; avatarData?: string | null; size?: number }) {
  const colors = useColors();

  let skinColor = colors.primary;
  if (avatarData) {
    try {
      const parsed = JSON.parse(avatarData) as { skinTone?: string };
      if (parsed.skinTone) skinColor = parsed.skinTone;
    } catch {}
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: skinColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.4, fontFamily: "Inter_700Bold" }}>
        {displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const { data: entries = [], isLoading, refetch } = useGetLeaderboard({
    query: { queryKey: getGetLeaderboardQueryKey() },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const topThree = (entries as LeaderboardEntry[]).slice(0, 3);
  const rest = (entries as LeaderboardEntry[]).slice(3);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          Leaderboard
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Ranked by animal collection
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
      >
        {/* Podium */}
        {topThree.length > 0 && (
          <View style={[styles.podiumCard, { backgroundColor: colors.primary }]}>
            <Text style={[styles.podiumTitle, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_600SemiBold" }]}>
              Top Collectors
            </Text>
            <View style={styles.podiumRow}>
              {topThree.map((entry, idx) => (
                <View key={entry.userId} style={[styles.podiumItem, idx === 0 && styles.podiumCenter]}>
                  <View style={{ position: "relative" }}>
                    <AvatarCircle
                      displayName={entry.displayName}
                      avatarData={entry.avatarData}
                      size={idx === 0 ? 64 : 52}
                    />
                    {idx < 3 && (
                      <View style={[styles.rankBadge, { backgroundColor: RARITY_COLORS_PODIUM[idx] }]}>
                        <Text style={[styles.rankNum, { fontFamily: "Inter_700Bold" }]}>{idx + 1}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.podiumName,
                      {
                        color: "#fff",
                        fontFamily: "Inter_600SemiBold",
                        fontSize: idx === 0 ? 14 : 12,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {entry.displayName}
                  </Text>
                  <View style={styles.animalCountRow}>
                    <Feather name="heart" size={12} color={colors.gold} />
                    <Text style={[styles.animalCountText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
                      {entry.animalCount}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Rest of list */}
        <View style={styles.listSection}>
          {rest.map((entry, idx) => {
            const rank = idx + 4;
            const isMe = entry.userId === user?.id;
            return (
              <View
                key={entry.userId}
                style={[
                  styles.entryRow,
                  {
                    backgroundColor: isMe ? colors.primary + "10" : colors.card,
                    borderColor: isMe ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.rankText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  #{rank}
                </Text>
                <AvatarCircle displayName={entry.displayName} avatarData={entry.avatarData} />
                <View style={styles.entryInfo}>
                  <View style={styles.entryTop}>
                    <Text style={[styles.entryName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {entry.displayName}
                      {isMe ? " (You)" : ""}
                    </Text>
                    <View style={styles.entryStats}>
                      <Feather name="zap" size={12} color={colors.gold} />
                      <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {entry.streakCount}
                      </Text>
                    </View>
                  </View>
                  {entry.animals.length > 0 && (
                    <View style={styles.animalPreview}>
                      {entry.animals.slice(0, 4).map((a) => (
                        <Text key={a.id} style={styles.previewEmoji}>{a.emoji}</Text>
                      ))}
                      {entry.animalCount > 4 && (
                        <Text style={[styles.moreAnimals, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          +{entry.animalCount - 4}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
                <View style={[styles.animalCountBadge, { backgroundColor: colors.primary + "12" }]}>
                  <Feather name="heart" size={14} color={colors.primary} />
                  <Text style={[styles.animalCountBig, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {entry.animalCount}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {entries.length === 0 && (
          <View style={styles.empty}>
            <Feather name="award" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No one on the leaderboard yet. Be the first!
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const RARITY_COLORS_PODIUM = ["#F59E0B", "#9CA3AF", "#B45309"];

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28 },
  subtitle: { fontSize: 14, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  podiumCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  podiumTitle: { fontSize: 13, marginBottom: 16, textAlign: "center" },
  podiumRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 20,
  },
  podiumItem: { alignItems: "center", gap: 6 },
  podiumCenter: { marginBottom: 12 },
  rankBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNum: { color: "#fff", fontSize: 10 },
  podiumName: { maxWidth: 70, textAlign: "center" },
  animalCountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  animalCountText: { fontSize: 13 },
  listSection: { gap: 10 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  rankText: { fontSize: 14, minWidth: 28 },
  entryInfo: { flex: 1, gap: 4 },
  entryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryName: { fontSize: 15 },
  entryStats: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 12 },
  animalPreview: { flexDirection: "row", alignItems: "center", gap: 2 },
  previewEmoji: { fontSize: 18 },
  moreAnimals: { fontSize: 12, marginLeft: 4 },
  animalCountBadge: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  animalCountBig: { fontSize: 16 },
  empty: { alignItems: "center", gap: 16, paddingTop: 60 },
  emptyText: { fontSize: 15, textAlign: "center" },
});
