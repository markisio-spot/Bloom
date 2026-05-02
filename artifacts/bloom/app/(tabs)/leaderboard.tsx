import { Feather } from "@expo/vector-icons";
import {
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
} from "@workspace/api-client-react";
import React from "react";
import {
  ActivityIndicator,
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
  try {
    return { ...DEFAULT_AVATAR, ...(JSON.parse(raw) as Partial<AvatarData>) };
  } catch {
    return DEFAULT_AVATAR;
  }
}

function AvatarHead({ avatarData, size = 44 }: { avatarData?: string | null; size?: number }) {
  const colors = useColors();
  const avatar = parseAvatar(avatarData);
  return (
    <View style={[styles.avatarRing, { width: size, height: size, borderRadius: size / 2, borderColor: colors.border }]}>
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
        <CartoonAvatarHead avatar={avatar} size={size} />
      </View>
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
              {topThree.map((entry, idx) => {
                const podiumSize = idx === 0 ? 62 : 50;
                return (
                  <View key={entry.userId} style={[styles.podiumItem, idx === 0 && styles.podiumCenter]}>
                    <View style={{ position: "relative" }}>
                      <AvatarHead avatarData={entry.avatarData} size={podiumSize} />
                      <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[idx] }]}>
                        <Text style={[styles.rankNum, { fontFamily: "Inter_700Bold" }]}>{idx + 1}</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.podiumName,
                        { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: idx === 0 ? 14 : 12 },
                      ]}
                      numberOfLines={1}
                    >
                      {entry.displayName}
                    </Text>
                    {/* Coins + animals */}
                    <View style={styles.podiumStats}>
                      <CoinIcon size={13} count={entry.coins} textStyle={{ color: colors.gold, fontSize: 11 }} />
                      <View style={styles.podiumStatDivider} />
                      <Feather name="heart" size={11} color={colors.gold} />
                      <Text style={[styles.podiumStatText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
                        {entry.animalCount}
                      </Text>
                    </View>
                  </View>
                );
              })}
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
                <AvatarHead avatarData={entry.avatarData} size={44} />
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {entry.displayName}{isMe ? " (You)" : ""}
                  </Text>
                  <View style={styles.entryStats}>
                    <CoinIcon size={14} count={entry.coins} textStyle={{ color: colors.mutedForeground, fontSize: 12 }} />
                    <View style={[styles.dotDivider, { backgroundColor: colors.border }]} />
                    <Feather name="heart" size={12} color="#EF4444" />
                    <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {entry.animalCount} animals
                    </Text>
                    {entry.streakCount > 0 && (
                      <>
                        <View style={[styles.dotDivider, { backgroundColor: colors.border }]} />
                        <Feather name="zap" size={12} color={colors.gold} />
                        <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          {entry.streakCount}
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

const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28 },
  subtitle: { fontSize: 14, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  podiumCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  podiumTitle: { fontSize: 13, marginBottom: 16, textAlign: "center" },
  podiumRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 18 },
  podiumItem: { alignItems: "center", gap: 5 },
  podiumCenter: { marginBottom: 12 },
  rankBadge: {
    position: "absolute", bottom: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  rankNum: { color: "#fff", fontSize: 10 },
  podiumName: { maxWidth: 72, textAlign: "center" },
  podiumStats: { flexDirection: "row", alignItems: "center", gap: 5 },
  podiumStatDivider: { width: 1, height: 10, backgroundColor: "rgba(255,255,255,0.3)" },
  podiumStatText: { fontSize: 11 },
  avatarRing: { borderWidth: 2, overflow: "hidden" },
  listSection: { gap: 10 },
  entryRow: {
    flexDirection: "row", alignItems: "center",
    padding: 12, borderRadius: 16, borderWidth: 1.5, gap: 10,
  },
  rankText: { fontSize: 14, minWidth: 28 },
  entryInfo: { flex: 1, gap: 3 },
  entryName: { fontSize: 15 },
  entryStats: { flexDirection: "row", alignItems: "center", gap: 5 },
  dotDivider: { width: 3, height: 3, borderRadius: 1.5 },
  statText: { fontSize: 12 },
  animalPreview: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  previewEmoji: { fontSize: 17 },
  moreAnimals: { fontSize: 12, marginLeft: 4 },
  empty: { alignItems: "center", gap: 16, paddingTop: 60 },
  emptyText: { fontSize: 15, textAlign: "center" },
});
