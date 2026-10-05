import React, { type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={[styles.brand, { backgroundColor: colors.primary }]}>
            <View style={styles.brandIcon}>
              <Feather name="cloud-drizzle" size={20} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.brandName, { color: colors.primaryForeground }]}>MAUSAM</Text>
            <Text style={[styles.tagline, { color: colors.primaryForeground }]}>Your weather, made personal.</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AuthTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoComplete?: "email" | "password" | "new-password" | "one-time-code";
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

export function AuthPrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: colors.primary, opacity: disabled ? 0.55 : pressed ? 0.84 : 1 },
      ]}
    >
      <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{label}</Text>
      <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 22 },
  content: { alignSelf: "center", width: "100%", maxWidth: 460, paddingBottom: 24 },
  brand: { borderRadius: 24, padding: 20, marginBottom: 28 },
  brandIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", marginBottom: 11 },
  brandName: { fontSize: 14, letterSpacing: 3.5, fontWeight: "800" },
  tagline: { fontSize: 12, marginTop: 4, opacity: 0.82 },
  title: { fontSize: 25, lineHeight: 32, fontWeight: "700", letterSpacing: -0.6 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 17 },
  field: { marginTop: 13 },
  label: { fontSize: 10, letterSpacing: 1.2, fontWeight: "800", marginBottom: 8 },
  input: { borderRadius: 14, borderWidth: 1, minHeight: 50, paddingHorizontal: 15, fontSize: 15 },
  primary: { minHeight: 52, borderRadius: 15, marginTop: 18, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryText: { fontSize: 14, fontWeight: "700" },
});

