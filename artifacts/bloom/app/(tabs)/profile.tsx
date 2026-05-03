import { Feather } from "@expo/vector-icons";
import {
  useGetMe,
  useGetOwnedAnimals,
  useGetProgress,
  useUpdateMe,
  useClaimMonthlyGift,
  useGetFriends,
  useGetFriendRequests,
  useSearchUsers,
  getSearchUsersQueryKey,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useRemoveFriend,
  getGetMeQueryKey,
  getGetOwnedAnimalsQueryKey,
  getGetProgressQueryKey,
  getGetFriendsQueryKey,
  getGetFriendRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import {
  SeedlingAvatar,
  SeedlingAvatarHead,
  DEFAULT_SEEDLING,
  getStage,
  type SeedlingData,
} from "@/components/SeedlingAvatar";
import CoinIcon from "@/components/CoinIcon";

const EXPRESSIONS = [
  { key: "happy",      label: "😊 Happy" },
  { key: "cool",       label: "😎 Cool" },
  { key: "studious",   label: "🤓 Studious" },
  { key: "excited",    label: "🤩 Excited" },
  { key: "calm",       label: "😌 Calm" },
  { key: "determined", label: "😤 Determined" },
];

const PETAL_COLORS = [
  "#F5C518", "#EF4444", "#EC4899", "#8B5CF6",
  "#3B82F6", "#22C55E", "#F97316", "#06B6D4",
];

const STAGE_INFO: Record<number, { name: string; emoji: string; nextCoins: number | null; desc: string }> = {
  1: { name: "Sprout",     emoji: "🌱", nextCoins: 100,  desc: "Just getting started!" },
  2: { name: "Seedling",   emoji: "🌿", nextCoins: 500,  desc: "Growing nicely!" },
  3: { name: "Blossom",    emoji: "🌸", nextCoins: 2000, desc: "Almost in full bloom!" },
  4: { name: "Full Bloom", emoji: "🌻", nextCoins: null, desc: "You've reached full bloom!" },
};

const STAGE_THRESHOLDS = [0, 100, 500, 2000];

function parseSeedling(raw: string | null | undefined): SeedlingData {
  if (!raw) return DEFAULT_SEEDLING;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      expression: typeof parsed.expression === "string" ? parsed.expression : DEFAULT_SEEDLING.expression,
      petalColor: typeof parsed.petalColor === "string" ? parsed.petalColor : DEFAULT_SEEDLING.petalColor,
    };
  } catch { return DEFAULT_SEEDLING; }
}

export default function ProfileScreen() {
  const colors = useColors();
  const { token, user: authUser, logout, updateUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [seedling, setSeedling] = useState<SeedlingData>(DEFAULT_SEEDLING);
  const [giftMessage, setGiftMessage] = useState("");
  const [friendsTab, setFriendsTab] = useState<"friends" | "requests">("friends");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: me, isLoading } = useGetMe({ query: { enabled: !!token, queryKey: getGetMeQueryKey() } });
  const { data: ownedAnimals = [] } = useGetOwnedAnimals({ query: { enabled: !!token, queryKey: getGetOwnedAnimalsQueryKey() } });
  const { data: progress = [] } = useGetProgress({ query: { enabled: !!token, queryKey: getGetProgressQueryKey() } });
  const { data: friends = [] } = useGetFriends({ query: { enabled: !!token, queryKey: getGetFriendsQueryKey() } });
  const { data: friendRequests = [] } = useGetFriendRequests({ query: { enabled: !!token, queryKey: getGetFriendRequestsQueryKey() } });
  const { data: searchResults = [], isLoading: searching } = useSearchUsers(
    { q: searchQuery },
    { query: { enabled: searchQuery.length >= 2, queryKey: getSearchUsersQueryKey({ q: searchQuery }) } }
  );

  const updateMeMutation = useUpdateMe({
    mutation: {
      onSuccess: (data) => {
        updateUser({ displayName: data.displayName, avatarData: data.avatarData });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setEditingName(false);
      },
    },
  });
  const claimGiftMutation = useClaimMonthlyGift({
    mutation: {
      onSuccess: (data) => {
        setGiftMessage(data.message ?? "");
        updateUser({ coins: data.newBalance ?? 0 });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
    },
  });
  const sendRequestMutation = useSendFriendRequest({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() }) },
  });
  const respondMutation = useRespondToFriendRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
      },
    },
  });
  const removeFriendMutation = useRemoveFriend({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() }) },
  });

  useEffect(() => {
    if (me?.avatarData) {
      try { setSeedling(parseSeedling(me.avatarData)); } catch {}
    }
  }, [me?.avatarData]);

  const handleSaveAvatar = () =>
    updateMeMutation.mutate({ data: { avatarData: JSON.stringify(seedling) } });
  const handleSaveName = () => {
    if (!newName.trim()) return;
    updateMeMutation.mutate({ data: { displayName: newName.trim() } });
  };

  const displayUser = me ?? authUser;
  if (isLoading && !displayUser) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  const coins = displayUser?.coins ?? 0;
  const stage = getStage(coins);
  const stageInfo = STAGE_INFO[stage]!;
  const today = new Date().toISOString().slice(0, 7);
  const canClaimGift = !displayUser?.lastGiftDate || !displayUser.lastGiftDate.startsWith(today);
  const pendingCount = (friendRequests as Array<{ friendshipId: number }>).length;

  const currentThreshold = STAGE_THRESHOLDS[stage - 1] ?? 0;
  const nextThreshold = stageInfo.nextCoins;
  const stageProgress = nextThreshold
    ? Math.min((coins - currentThreshold) / (nextThreshold - currentThreshold), 1)
    : 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Profile Header ── */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerAvatarWrap}>
            <SeedlingAvatar seedling={seedling} size={72} coins={coins} />
          </View>
          <View style={styles.headerInfo}>
            {editingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  style={[styles.nameInput, { color: "#fff", borderColor: "rgba(255,255,255,0.4)", fontFamily: "Inter_600SemiBold" }]}
                  value={newName} onChangeText={setNewName} autoFocus
                  placeholder="Display name" placeholderTextColor="rgba(255,255,255,0.5)"
                />
                <Pressable onPress={handleSaveName} disabled={updateMeMutation.isPending}>
                  <Feather name="check" size={20} color={colors.gold} />
                </Pressable>
                <Pressable onPress={() => setEditingName(false)}>
                  <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.nameRow} onPress={() => { setNewName(displayUser?.displayName ?? ""); setEditingName(true); }}>
                <Text style={[styles.displayName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{displayUser?.displayName}</Text>
                <Feather name="edit-2" size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
            <Text style={[styles.username, { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" }]}>@{displayUser?.username}</Text>
            <View style={styles.statsRow}>
              <CoinIcon size={16} count={coins} textStyle={{ color: colors.gold, fontSize: 14 }} />
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Feather name="zap" size={14} color={colors.gold} />
                <Text style={[styles.statValue, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>{displayUser?.streakCount ?? 0}d</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Feather name="users" size={14} color={colors.gold} />
                <Text style={[styles.statValue, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>{(friends as unknown[]).length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Monthly Gift ── */}
        {canClaimGift && (
          <Pressable style={[styles.giftCard, { backgroundColor: colors.gold + "15", borderColor: colors.gold }]}
            onPress={() => claimGiftMutation.mutate(undefined)} disabled={claimGiftMutation.isPending}>
            <Text style={{ fontSize: 24 }}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.giftTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Monthly Gift Available!</Text>
              <Text style={[styles.giftSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Claim your free coins</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.gold} />
          </Pressable>
        )}
        {giftMessage ? (
          <View style={[styles.giftMsg, { backgroundColor: colors.correct + "15", borderColor: colors.correct }]}>
            <Feather name="check-circle" size={16} color={colors.correct} />
            <Text style={[styles.giftMsgText, { color: colors.correct, fontFamily: "Inter_400Regular" }]}>{giftMessage}</Text>
          </View>
        ) : null}

        {/* ── My Sprout ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>🌱 My Sprout</Text>

          <View style={[styles.builderCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.cardShadow2} />

            {/* Preview + Stage info */}
            <View style={styles.sproutPreviewRow}>
              <SeedlingAvatar seedling={seedling} size={96} coins={coins} />
              <View style={styles.stageInfoCol}>
                <View style={[styles.stageBadge, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}>
                  <Text style={[styles.stageEmoji]}>{stageInfo.emoji}</Text>
                  <Text style={[styles.stageName, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {stageInfo.name}
                  </Text>
                </View>
                <Text style={[styles.stageDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {stageInfo.desc}
                </Text>
                {nextThreshold && (
                  <View style={styles.stageProgressWrap}>
                    <View style={[styles.stageProgressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.stageProgressFill, { backgroundColor: colors.gold, width: `${stageProgress * 100}%` }]} />
                    </View>
                    <Text style={[styles.stageProgressLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {coins}/{nextThreshold} coins → {STAGE_INFO[stage + 1]?.emoji}
                    </Text>
                  </View>
                )}
                {!nextThreshold && (
                  <Text style={[styles.stageDesc, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
                    ✨ Max level reached!
                  </Text>
                )}
                <Pressable
                  style={[styles.saveAvatarBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveAvatar}
                  disabled={updateMeMutation.isPending}
                >
                  <Feather name="save" size={14} color="#fff" />
                  <Text style={[styles.saveAvatarText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                    {updateMeMutation.isPending ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Expression */}
            <BuilderRow label="Expression">
              {EXPRESSIONS.map(({ key, label }) => (
                <Pressable
                  key={key}
                  style={[styles.optionTag, {
                    backgroundColor: seedling.expression === key ? colors.primary : colors.background,
                    borderColor: seedling.expression === key ? colors.primary : colors.border,
                  }]}
                  onPress={() => setSeedling({ ...seedling, expression: key })}
                >
                  <Text style={[styles.tagText, {
                    color: seedling.expression === key ? "#fff" : colors.primary,
                    fontFamily: "Inter_600SemiBold",
                  }]}>{label}</Text>
                </Pressable>
              ))}
            </BuilderRow>

            {/* Petal / bud color */}
            <BuilderRow label="Petal Color">
              {PETAL_COLORS.map((clr) => (
                <Pressable
                  key={clr}
                  style={[styles.colorDot, { backgroundColor: clr },
                    seedling.petalColor === clr && styles.colorDotSelected]}
                  onPress={() => setSeedling({ ...seedling, petalColor: clr })}
                />
              ))}
            </BuilderRow>
          </View>
        </View>

        {/* ── Friends ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>👫 Friends</Text>
            <Pressable style={[styles.addFriendBtn, { backgroundColor: colors.primary }]} onPress={() => setSearchOpen(true)}>
              <Feather name="user-plus" size={14} color="#fff" />
              <Text style={[styles.addFriendText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Find</Text>
            </Pressable>
          </View>

          <View style={[styles.friendsTabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              style={[styles.friendsTabBtn, friendsTab === "friends" && { backgroundColor: colors.primary }]}
              onPress={() => setFriendsTab("friends")}
            >
              <Text style={[styles.friendsTabText, { color: friendsTab === "friends" ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                Friends ({(friends as unknown[]).length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.friendsTabBtn, friendsTab === "requests" && { backgroundColor: colors.primary }]}
              onPress={() => setFriendsTab("requests")}
            >
              <Text style={[styles.friendsTabText, { color: friendsTab === "requests" ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                Requests {pendingCount > 0 ? `(${pendingCount})` : ""}
              </Text>
            </Pressable>
          </View>

          {friendsTab === "friends" && (
            <View style={styles.friendsList}>
              {(friends as Array<{ id: number; displayName: string; username: string; avatarData?: string | null; coins: number; streakCount: number; friendshipId?: number }>).length === 0 ? (
                <View style={[styles.emptyFriends, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 36 }}>🌟</Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    No friends yet. Search for friends to add them!
                  </Text>
                </View>
              ) : (
                (friends as Array<{ id: number; displayName: string; username: string; avatarData?: string | null; coins: number; streakCount: number; friendshipId?: number }>).map((f) => (
                  <View key={f.id} style={[styles.friendRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.friendAvatarClip, { borderColor: colors.primary }]}>
                      <SeedlingAvatarHead seedling={parseSeedling(f.avatarData)} size={44} coins={f.coins} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.friendName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{f.displayName}</Text>
                      <Text style={[styles.friendUsername, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>@{f.username}</Text>
                    </View>
                    <CoinIcon size={14} count={f.coins} textStyle={{ color: colors.mutedForeground, fontSize: 12 }} />
                    <Pressable style={styles.removeFriendBtn} onPress={() => f.friendshipId && removeFriendMutation.mutate({ id: f.friendshipId })}>
                      <Feather name="user-x" size={16} color={colors.wrong} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}

          {friendsTab === "requests" && (
            <View style={styles.friendsList}>
              {(friendRequests as Array<{ friendshipId: number; requester?: { id: number; displayName: string; username: string; avatarData?: string | null } }>).length === 0 ? (
                <View style={[styles.emptyFriends, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 36 }}>📬</Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>No pending requests</Text>
                </View>
              ) : (
                (friendRequests as Array<{ friendshipId: number; requester?: { id: number; displayName: string; username: string; avatarData?: string | null } }>).map((req) => (
                  <View key={req.friendshipId} style={[styles.friendRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.friendAvatarClip, { borderColor: colors.primary }]}>
                      <SeedlingAvatarHead seedling={parseSeedling(req.requester?.avatarData)} size={44} coins={0} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.friendName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{req.requester?.displayName}</Text>
                      <Text style={[styles.friendUsername, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>@{req.requester?.username}</Text>
                    </View>
                    <Pressable style={[styles.respondBtn, { backgroundColor: colors.correct }]}
                      onPress={() => respondMutation.mutate({ id: req.friendshipId, data: { status: "accepted" } })}>
                      <Feather name="check" size={14} color="#fff" />
                    </Pressable>
                    <Pressable style={[styles.respondBtn, { backgroundColor: colors.wrong }]}
                      onPress={() => respondMutation.mutate({ id: req.friendshipId, data: { status: "declined" } })}>
                      <Feather name="x" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Progress ── */}
        {progress.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>📊 Progress</Text>
            <View style={styles.progressList}>
              {progress.map((p) => (
                <View key={p.subject} style={[styles.progressItem, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                  <View style={styles.progressTop}>
                    <Text style={[styles.progressSubject, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {p.subject.charAt(0).toUpperCase() + p.subject.slice(1)}
                    </Text>
                    <Text style={[styles.progressLevel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Level {p.currentLevel}</Text>
                  </View>
                  <View style={[styles.progressBarOuter, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressBarInner, { backgroundColor: colors.primary, width: `${Math.min((p.highestScore ?? 0), 100)}%` }]} />
                  </View>
                  <Text style={[styles.progressStats, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {p.lessonsCompleted} lessons · Best: {p.highestScore ?? 0}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Animal Collection ── */}
        {ownedAnimals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>🐾 My Collection</Text>
            <View style={styles.collectionGrid}>
              {(ownedAnimals as Array<{ id: number; name: string; emoji: string; rarity: string }>).map((a) => (
                <View key={a.id} style={[styles.collectionItem, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                  <Text style={styles.collectionEmoji}>{a.emoji}</Text>
                  <Text style={[styles.collectionName, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{a.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Logout ── */}
        <Pressable style={[styles.logoutBtn, { borderColor: colors.wrong + "60" }]}
          onPress={() => { logout(); router.replace("/"); }}>
          <Feather name="log-out" size={18} color={colors.wrong} />
          <Text style={[styles.logoutText, { color: colors.wrong, fontFamily: "Inter_600SemiBold" }]}>Log Out</Text>
        </Pressable>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Friend Search Modal ── */}
      <Modal visible={searchOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>🔍 Find Friends</Text>
            <Pressable onPress={() => { setSearchOpen(false); setSearchQuery(""); }}>
              <Feather name="x" size={22} color={colors.primary} />
            </Pressable>
          </View>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.primary, fontFamily: "Inter_400Regular" }]}
              placeholder="Search by username or name..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          <ScrollView style={styles.searchResults}>
            {(searchResults as Array<{ id: number; username: string; displayName: string; avatarData?: string | null }>).map((u) => (
              <View key={u.id} style={[styles.searchResultRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.friendAvatarClip, { borderColor: colors.primary }]}>
                  <SeedlingAvatarHead seedling={parseSeedling(u.avatarData)} size={44} coins={0} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.friendName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{u.displayName}</Text>
                  <Text style={[styles.friendUsername, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>@{u.username}</Text>
                </View>
                <Pressable
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={() => sendRequestMutation.mutate({ data: { targetUserId: u.id } })}
                  disabled={sendRequestMutation.isPending}
                >
                  <Feather name="user-plus" size={14} color="#fff" />
                  <Text style={[styles.addBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Add</Text>
                </Pressable>
              </View>
            ))}
            {searchQuery.length >= 2 && !searching && (searchResults as unknown[]).length === 0 && (
              <Text style={[styles.noResultsText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>No users found</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function BuilderRow({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.builderRow}>
      <Text style={[styles.builderLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.colorRow}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 16,
    padding: 20, paddingTop: 16, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 16,
  },
  headerAvatarWrap: { alignItems: "center" },
  headerInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: { flex: 1, borderBottomWidth: 1, fontSize: 18, paddingVertical: 4 },
  displayName: { fontSize: 22 },
  username: { fontSize: 13 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statValue: { fontSize: 14 },
  statDivider: { width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.25)" },
  giftCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 20, padding: 16, borderRadius: 18, borderWidth: 2, marginBottom: 10,
  },
  giftTitle: { fontSize: 15 },
  giftSubtitle: { fontSize: 12, marginTop: 2 },
  giftMsg: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 20, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 10,
  },
  giftMsgText: { fontSize: 13, flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 20, marginBottom: 14 },
  builderCard: { borderRadius: 20, borderWidth: 2.5, padding: 16, gap: 16, position: "relative", overflow: "hidden" },
  cardShadow2: { position: "absolute", bottom: -4, left: 4, right: -4, height: "100%", borderRadius: 20, backgroundColor: "#1B3A6B", zIndex: -1 },
  sproutPreviewRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  stageInfoCol: { flex: 1, gap: 8 },
  stageBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, alignSelf: "flex-start",
  },
  stageEmoji: { fontSize: 16 },
  stageName: { fontSize: 15 },
  stageDesc: { fontSize: 12 },
  stageProgressWrap: { gap: 4 },
  stageProgressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  stageProgressFill: { height: "100%", borderRadius: 3 },
  stageProgressLabel: { fontSize: 11 },
  saveAvatarBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignSelf: "flex-start" },
  saveAvatarText: { fontSize: 13 },
  builderRow: { gap: 8 },
  builderLabel: { fontSize: 13 },
  colorRow: { flexDirection: "row", gap: 10, paddingVertical: 2 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: "#1B3A6B" },
  optionTag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 2 },
  tagText: { fontSize: 13 },
  addFriendBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  addFriendText: { fontSize: 13 },
  friendsTabs: { flexDirection: "row", borderRadius: 14, borderWidth: 1.5, overflow: "hidden", marginBottom: 12 },
  friendsTabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  friendsTabText: { fontSize: 13 },
  friendsList: { gap: 10 },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  friendAvatarClip: { width: 46, height: 46, borderRadius: 23, overflow: "hidden", borderWidth: 2 },
  friendName: { fontSize: 15 },
  friendUsername: { fontSize: 12, marginTop: 1 },
  removeFriendBtn: { padding: 4 },
  respondBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  emptyFriends: { padding: 24, borderRadius: 16, borderWidth: 1.5, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, textAlign: "center" },
  progressList: { gap: 12 },
  progressItem: { padding: 14, borderRadius: 16, borderWidth: 2, gap: 8 },
  progressTop: { flexDirection: "row", justifyContent: "space-between" },
  progressSubject: { fontSize: 15 },
  progressLevel: { fontSize: 13 },
  progressBarOuter: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarInner: { height: "100%", borderRadius: 4 },
  progressStats: { fontSize: 12 },
  collectionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  collectionItem: { alignItems: "center", padding: 12, borderRadius: 16, borderWidth: 2, minWidth: 80 },
  collectionEmoji: { fontSize: 32 },
  collectionName: { fontSize: 11, textAlign: "center", marginTop: 4 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    marginHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 2, marginTop: 8,
  },
  logoutText: { fontSize: 15 },
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 22 },
  searchInputWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, padding: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  searchResults: { paddingHorizontal: 20 },
  searchResultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1.5, marginBottom: 10 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { fontSize: 13 },
  noResultsText: { textAlign: "center", marginTop: 24, fontSize: 15 },
});
