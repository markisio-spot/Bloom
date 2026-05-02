import { Feather } from "@expo/vector-icons";
import {
  useGetMe,
  useGetOwnedAnimals,
  useGetProgress,
  useUpdateMe,
  useClaimMonthlyGift,
  getGetMeQueryKey,
  getGetOwnedAnimalsQueryKey,
  getGetProgressQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { CartoonAvatar, type AvatarData } from "@/components/CartoonAvatar";
import CoinIcon from "@/components/CoinIcon";

const SKIN_TONES = ["#FDDBB4", "#F5C5A3", "#E8A87C", "#C68642", "#8D5524", "#4A2912"];
const HAIR_COLORS = ["#1B3A6B", "#4A2912", "#8B4513", "#D4AC2B", "#F5C518", "#E0E0E0", "#FF4444"];
const HAIR_STYLES = ["short", "long", "curly", "bun", "spiky"];
const EYE_COLORS = ["#1B3A6B", "#4A2912", "#22C55E", "#3B82F6", "#9CA3AF"];
const EXPRESSIONS = ["happy", "cool", "studious", "excited", "calm"];
const CLOTHINGS = ["casual", "uniform", "sporty", "formal", "creative"];

const DEFAULT_AVATAR: AvatarData = {
  skinTone: "#FDDBB4",
  hairColor: "#1B3A6B",
  hairStyle: "short",
  eyeColor: "#1B3A6B",
  clothing: "casual",
  accessory: "none",
  expression: "happy",
};

export default function ProfileScreen() {
  const colors = useColors();
  const { token, user: authUser, logout, updateUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [avatar, setAvatar] = useState<AvatarData>(DEFAULT_AVATAR);
  const [giftMessage, setGiftMessage] = useState("");

  const { data: me, isLoading } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  const { data: ownedAnimals = [] } = useGetOwnedAnimals({
    query: { enabled: !!token, queryKey: getGetOwnedAnimalsQueryKey() },
  });

  const { data: progress = [] } = useGetProgress({
    query: { enabled: !!token, queryKey: getGetProgressQueryKey() },
  });

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

  useEffect(() => {
    if (me?.avatarData) {
      try {
        const parsed = JSON.parse(me.avatarData) as Partial<AvatarData>;
        setAvatar({ ...DEFAULT_AVATAR, ...parsed });
      } catch {}
    }
  }, [me?.avatarData]);

  const handleSaveAvatar = () => {
    updateMeMutation.mutate({ data: { avatarData: JSON.stringify(avatar) } });
  };

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

  const today = new Date().toISOString().slice(0, 7);
  const canClaimGift = !displayUser?.lastGiftDate || !displayUser.lastGiftDate.startsWith(today);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <CartoonAvatar avatar={avatar} size={72} />
          <View style={styles.headerInfo}>
            {editingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  style={[styles.nameInput, { color: "#fff", borderColor: "rgba(255,255,255,0.4)", fontFamily: "Inter_600SemiBold" }]}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  placeholder="Display name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
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
                <Text style={[styles.displayName, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  {displayUser?.displayName}
                </Text>
                <Feather name="edit-2" size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
            <Text style={[styles.username, { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" }]}>
              @{displayUser?.username}
            </Text>
            <View style={styles.statsRow}>
              <CoinIcon size={16} count={displayUser?.coins ?? 0} textStyle={{ color: colors.gold, fontSize: 14 }} />
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Feather name="zap" size={14} color={colors.gold} />
                <Text style={[styles.statValue, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  {displayUser?.streakCount ?? 0} days
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Feather name="heart" size={14} color={colors.gold} />
                <Text style={[styles.statValue, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  {ownedAnimals.length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Gift */}
        {canClaimGift && (
          <Pressable
            style={[styles.giftCard, { backgroundColor: colors.gold + "15", borderColor: colors.gold }]}
            onPress={() => claimGiftMutation.mutate(undefined)}
            disabled={claimGiftMutation.isPending}
          >
            <Feather name="gift" size={24} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.giftTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                Monthly Gift Available!
              </Text>
              <Text style={[styles.giftSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Claim your free coins for this month
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.gold} />
          </Pressable>
        )}
        {giftMessage ? (
          <View style={[styles.giftMsg, { backgroundColor: colors.correct + "15", borderColor: colors.correct }]}>
            <Feather name="check-circle" size={16} color={colors.correct} />
            <Text style={[styles.giftMsgText, { color: colors.correct, fontFamily: "Inter_400Regular" }]}>
              {giftMessage}
            </Text>
          </View>
        ) : null}

        {/* Avatar Builder */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            Avatar Builder
          </Text>

          <View style={styles.avatarBuilderCard}>
            <View style={styles.avatarPreviewRow}>
              <CartoonAvatar avatar={avatar} size={80} />
              <Pressable
                style={[styles.saveAvatarBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveAvatar}
                disabled={updateMeMutation.isPending}
              >
                <Feather name="save" size={16} color="#fff" />
                <Text style={[styles.saveAvatarText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  {updateMeMutation.isPending ? "Saving..." : "Save Avatar"}
                </Text>
              </Pressable>
            </View>

            {/* Skin Tone */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Skin Tone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorRow}>
                  {SKIN_TONES.map((tone) => (
                    <Pressable
                      key={tone}
                      style={[styles.colorDot, { backgroundColor: tone }, avatar.skinTone === tone && styles.colorDotSelected]}
                      onPress={() => setAvatar({ ...avatar, skinTone: tone })}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Hair Color */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Hair Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorRow}>
                  {HAIR_COLORS.map((clr) => (
                    <Pressable
                      key={clr}
                      style={[styles.colorDot, { backgroundColor: clr }, avatar.hairColor === clr && styles.colorDotSelected]}
                      onPress={() => setAvatar({ ...avatar, hairColor: clr })}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Hair Style */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Hair Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tagRow}>
                  {HAIR_STYLES.map((hs) => (
                    <Pressable
                      key={hs}
                      style={[
                        styles.optionTag,
                        {
                          backgroundColor: avatar.hairStyle === hs ? colors.primary : colors.card,
                          borderColor: avatar.hairStyle === hs ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setAvatar({ ...avatar, hairStyle: hs })}
                    >
                      <Text style={[styles.tagText, { color: avatar.hairStyle === hs ? "#fff" : colors.primary, fontFamily: "Inter_400Regular" }]}>
                        {hs}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Eye Color */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Eye Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorRow}>
                  {EYE_COLORS.map((clr) => (
                    <Pressable
                      key={clr}
                      style={[styles.colorDot, { backgroundColor: clr }, avatar.eyeColor === clr && styles.colorDotSelected]}
                      onPress={() => setAvatar({ ...avatar, eyeColor: clr })}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Expression */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Expression</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tagRow}>
                  {EXPRESSIONS.map((ex) => (
                    <Pressable
                      key={ex}
                      style={[
                        styles.optionTag,
                        {
                          backgroundColor: avatar.expression === ex ? colors.primary : colors.card,
                          borderColor: avatar.expression === ex ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setAvatar({ ...avatar, expression: ex })}
                    >
                      <Text style={[styles.tagText, { color: avatar.expression === ex ? "#fff" : colors.primary, fontFamily: "Inter_400Regular" }]}>
                        {ex}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Clothing */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Clothing</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tagRow}>
                  {CLOTHINGS.map((cl) => (
                    <Pressable
                      key={cl}
                      style={[
                        styles.optionTag,
                        {
                          backgroundColor: avatar.clothing === cl ? colors.primary : colors.card,
                          borderColor: avatar.clothing === cl ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setAvatar({ ...avatar, clothing: cl })}
                    >
                      <Text style={[styles.tagText, { color: avatar.clothing === cl ? "#fff" : colors.primary, fontFamily: "Inter_400Regular" }]}>
                        {cl}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Subject Progress */}
        {progress.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              Progress
            </Text>
            <View style={styles.progressList}>
              {progress.map((p) => (
                <View key={p.subject} style={[styles.progressItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.progressTop}>
                    <Text style={[styles.progressSubject, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {p.subject.charAt(0).toUpperCase() + p.subject.slice(1)}
                    </Text>
                    <Text style={[styles.progressLevel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Level {p.currentLevel}
                    </Text>
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

        {/* Animal Collection */}
        {ownedAnimals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              My Collection
            </Text>
            <View style={styles.collectionGrid}>
              {(ownedAnimals as Array<{ id: number; name: string; emoji: string; rarity: string }>).map((a) => (
                <View key={a.id} style={[styles.collectionItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.collectionEmoji}>{a.emoji}</Text>
                  <Text style={[styles.collectionName, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                    {a.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Logout */}
        <Pressable
          style={[styles.logoutBtn, { borderColor: colors.wrong + "60" }]}
          onPress={() => { logout(); router.replace("/"); }}
        >
          <Feather name="log-out" size={18} color={colors.wrong} />
          <Text style={[styles.logoutText, { color: colors.wrong, fontFamily: "Inter_600SemiBold" }]}>
            Log Out
          </Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
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
    marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 10,
  },
  giftTitle: { fontSize: 15 },
  giftSubtitle: { fontSize: 12, marginTop: 2 },
  giftMsg: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 20, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10,
  },
  giftMsgText: { fontSize: 13, flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, marginBottom: 14 },
  avatarBuilderCard: { gap: 16 },
  avatarPreviewRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  saveAvatarBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  saveAvatarText: { fontSize: 14 },
  builderRow: { gap: 8 },
  builderLabel: { fontSize: 13 },
  colorRow: { flexDirection: "row", gap: 10 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: "#1B3A6B", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tagRow: { flexDirection: "row", gap: 8 },
  optionTag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  tagText: { fontSize: 13 },
  progressList: { gap: 12 },
  progressItem: { padding: 14, borderRadius: 14, borderWidth: 1.5, gap: 8 },
  progressTop: { flexDirection: "row", justifyContent: "space-between" },
  progressSubject: { fontSize: 15 },
  progressLevel: { fontSize: 13 },
  progressBarOuter: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarInner: { height: "100%", borderRadius: 3 },
  progressStats: { fontSize: 12 },
  collectionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  collectionItem: { alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1.5, minWidth: 80 },
  collectionEmoji: { fontSize: 32 },
  collectionName: { fontSize: 11, textAlign: "center", marginTop: 4 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    marginHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 8,
  },
  logoutText: { fontSize: 15 },
});
