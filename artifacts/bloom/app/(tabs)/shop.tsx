import { Feather } from "@expo/vector-icons";
import {
  useListAnimals,
  useGetOwnedAnimals,
  usePurchaseAnimal,
  useGetMe,
  getListAnimalsQueryKey,
  getGetOwnedAnimalsQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
const RARITY_COLORS: Record<Rarity, string> = {
  common: "#6B7FA3",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
};
const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

interface Animal {
  id: number;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  rarity: string;
}

export default function ShopScreen() {
  const colors = useColors();
  const { token, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [filter, setFilter] = useState<Rarity | "all">("all");

  const { data: allAnimals = [], isLoading: animalsLoading } = useListAnimals({
    query: { queryKey: getListAnimalsQueryKey() },
  });

  const { data: ownedAnimals = [], isLoading: ownedLoading } = useGetOwnedAnimals({
    query: { enabled: !!token, queryKey: getGetOwnedAnimalsQueryKey() },
  });

  const { data: me } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  const purchaseMutation = usePurchaseAnimal({
    mutation: {
      onSuccess: (data) => {
        updateUser({ coins: data.newBalance });
        queryClient.invalidateQueries({ queryKey: getGetOwnedAnimalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setConfirmModal(false);
        setSelectedAnimal(null);
      },
    },
  });

  const ownedIds = new Set((ownedAnimals as Animal[]).map((a) => a.id));
  const coins = me?.coins ?? 0;

  const grouped = RARITY_ORDER.reduce<Record<string, Animal[]>>((acc, rarity) => {
    const filtered = (allAnimals as Animal[]).filter(
      (a) => a.rarity === rarity && (filter === "all" || filter === rarity)
    );
    if (filtered.length > 0) acc[rarity] = filtered;
    return acc;
  }, {});

  if (animalsLoading || ownedLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Animal Shop</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {ownedAnimals.length} collected
          </Text>
        </View>
        <View style={[styles.coinsBadge, { backgroundColor: colors.gold + "20" }]}>
          <Feather name="star" size={16} color={colors.gold} />
          <Text style={[styles.coinsText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {coins}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {(["all", ...RARITY_ORDER] as const).map((r) => (
          <Pressable
            key={r}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === r ? colors.primary : colors.card,
                borderColor: filter === r ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(r)}
          >
            <Text style={[
              styles.filterText,
              {
                color: filter === r ? "#fff" : colors.primary,
                fontFamily: filter === r ? "Inter_600SemiBold" : "Inter_400Regular",
              },
            ]}>
              {r === "all" ? "All" : RARITY_LABELS[r]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {Object.entries(grouped).map(([rarity, animals]) => (
          <View key={rarity} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity as Rarity] }]} />
              <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {RARITY_LABELS[rarity as Rarity]}
              </Text>
            </View>
            <View style={styles.animalGrid}>
              {animals.map((animal) => {
                const owned = ownedIds.has(animal.id);
                const canAfford = coins >= animal.cost;
                return (
                  <Pressable
                    key={animal.id}
                    style={[
                      styles.animalCard,
                      {
                        backgroundColor: owned ? colors.correct + "10" : colors.card,
                        borderColor: owned
                          ? colors.correct
                          : RARITY_COLORS[rarity as Rarity] + "40",
                        borderWidth: owned ? 2 : 1.5,
                      },
                    ]}
                    onPress={() => {
                      if (!owned) {
                        setSelectedAnimal(animal);
                        setConfirmModal(true);
                      }
                    }}
                    disabled={owned}
                  >
                    <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                    <Text style={[styles.animalName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                      {animal.name}
                    </Text>
                    {owned ? (
                      <View style={[styles.ownedBadge, { backgroundColor: colors.correct }]}>
                        <Feather name="check" size={12} color="#fff" />
                        <Text style={[styles.ownedText, { fontFamily: "Inter_600SemiBold" }]}>Owned</Text>
                      </View>
                    ) : (
                      <View style={[
                        styles.costBadge,
                        { backgroundColor: canAfford ? colors.gold + "20" : "#FEF2F2" },
                      ]}>
                        <Feather name="star" size={12} color={canAfford ? colors.gold : colors.wrong} />
                        <Text style={[
                          styles.costText,
                          { color: canAfford ? colors.primary : colors.wrong, fontFamily: "Inter_600SemiBold" },
                        ]}>
                          {animal.cost}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={confirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            {selectedAnimal && (
              <>
                <Text style={styles.modalEmoji}>{selectedAnimal.emoji}</Text>
                <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  Adopt {selectedAnimal.name}?
                </Text>
                <Text style={[styles.modalDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {selectedAnimal.description}
                </Text>
                <View style={[styles.modalCost, { backgroundColor: colors.gold + "15" }]}>
                  <Feather name="star" size={18} color={colors.gold} />
                  <Text style={[styles.modalCostText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {selectedAnimal.cost} coins
                  </Text>
                  {coins < selectedAnimal.cost && (
                    <Text style={[styles.notEnoughText, { color: colors.wrong, fontFamily: "Inter_400Regular" }]}>
                      (need {selectedAnimal.cost - coins} more)
                    </Text>
                  )}
                </View>
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => { setConfirmModal(false); setSelectedAnimal(null); }}
                  >
                    <Text style={[styles.cancelText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.buyBtn,
                      {
                        backgroundColor: coins >= selectedAnimal.cost ? colors.primary : colors.mutedForeground,
                      },
                    ]}
                    onPress={() => purchaseMutation.mutate({ data: { animalId: selectedAnimal.id } })}
                    disabled={coins < selectedAnimal.cost || purchaseMutation.isPending}
                  >
                    <Text style={[styles.buyText, { fontFamily: "Inter_600SemiBold" }]}>
                      {purchaseMutation.isPending ? "Buying..." : "Buy Now"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13, marginTop: 2 },
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinsText: { fontSize: 16 },
  filterRow: { maxHeight: 52, marginBottom: 4 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterText: { fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  rarityDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 16 },
  animalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  animalCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 6,
  },
  animalEmoji: { fontSize: 36 },
  animalName: { fontSize: 12, textAlign: "center" },
  ownedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ownedText: { color: "#fff", fontSize: 11 },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  costText: { fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 12,
    paddingBottom: 40,
  },
  modalEmoji: { fontSize: 64 },
  modalTitle: { fontSize: 24 },
  modalDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  modalCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  modalCostText: { fontSize: 18 },
  notEnoughText: { fontSize: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  cancelText: { fontSize: 15 },
  buyBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buyText: { color: "#fff", fontSize: 15 },
});
