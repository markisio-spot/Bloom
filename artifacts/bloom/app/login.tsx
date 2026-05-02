import { Feather } from "@expo/vector-icons";
import { useLogin } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        await login(data.token, data.user);
        router.replace("/(tabs)");
      },
      onError: () => {
        setError("Invalid username or password");
      },
    },
  });

  const handleLogin = () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    loginMutation.mutate({ data: { username: username.trim().toLowerCase(), password } });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.primary} />
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.logoMini, { backgroundColor: colors.primary }]}>
              <Feather name="star" size={24} color={colors.gold} />
            </View>
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Sign in to continue your learning journey
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Username
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                  placeholder="your_username"
                  placeholderTextColor={colors.mutedForeground}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Password
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="lock" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                <Feather name="alert-circle" size={15} color={colors.wrong} />
                <Text style={[styles.errorText, { color: colors.wrong, fontFamily: "Inter_400Regular" }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary },
                loginMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Text style={[styles.submitText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  Signing in...
                </Text>
              ) : (
                <Text style={[styles.submitText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                  Sign In
                </Text>
              )}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={[styles.switchText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Don't have an account?{" "}
              </Text>
              <Pressable onPress={() => router.replace("/register")}>
                <Text style={[styles.switchLink, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { marginTop: 12, width: 40, height: 40, justifyContent: "center" },
  header: { alignItems: "center", marginTop: 32, marginBottom: 36, gap: 10 },
  logoMini: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 28 },
  subtitle: { fontSize: 15, textAlign: "center" },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, height: "100%" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, flex: 1 },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#1B3A6B",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitText: { fontSize: 16 },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
});
