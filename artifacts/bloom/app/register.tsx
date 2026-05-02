import { Feather } from "@expo/vector-icons";
import { useRegister } from "@workspace/api-client-react";
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

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { login } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const registerMutation = useRegister({
    mutation: {
      onSuccess: async (data) => {
        await login(data.token, data.user);
        router.replace("/(tabs)");
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message ?? "Registration failed";
        setError(msg.includes("taken") ? "Username already taken" : msg);
      },
    },
  });

  const handleRegister = () => {
    setError("");
    if (!displayName.trim() || !username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    registerMutation.mutate({
      data: {
        username: username.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
      },
    });
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
              Create your account
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Start with 100 free coins. Your adventure begins now!
            </Text>
          </View>

          <View style={styles.form}>
            {[
              {
                label: "Display Name",
                placeholder: "Your name",
                value: displayName,
                onChange: setDisplayName,
                icon: "smile" as const,
                secure: false,
              },
              {
                label: "Username",
                placeholder: "unique_username",
                value: username,
                onChange: setUsername,
                icon: "user" as const,
                secure: false,
              },
            ].map((field) => (
              <View key={field.label} style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {field.label}
                </Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name={field.icon} size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={field.value}
                    onChangeText={field.onChange}
                    autoCapitalize={field.label === "Display Name" ? "words" : "none"}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Password
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="lock" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                  placeholder="Min. 6 characters"
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
                registerMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={handleRegister}
              disabled={registerMutation.isPending}
            >
              <Text style={[styles.submitText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </Text>
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={[styles.switchText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.replace("/login")}>
                <Text style={[styles.switchLink, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Sign In
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
  header: { alignItems: "center", marginTop: 28, marginBottom: 32, gap: 10 },
  logoMini: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  form: { gap: 14 },
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
