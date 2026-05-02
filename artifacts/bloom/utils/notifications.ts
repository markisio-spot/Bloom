import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STREAK_NOTIFICATION_ID_KEY = "bloom_streak_notif_id";

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleStreakReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await cancelStreakReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't break your streak! 🌸",
      body: "Come back to Bloom and keep learning today.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  });

  await AsyncStorage.setItem(STREAK_NOTIFICATION_ID_KEY, id);
}

export async function cancelStreakReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const id = await AsyncStorage.getItem(STREAK_NOTIFICATION_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(STREAK_NOTIFICATION_ID_KEY);
    }
  } catch {
    // ignore
  }
}

export async function sendLessonCompleteNotification(
  coinsEarned: number
): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lesson complete! 🌸",
      body: `Great job! You earned ${coinsEarned} coins.`,
      sound: true,
    },
    trigger: null,
  });
}
