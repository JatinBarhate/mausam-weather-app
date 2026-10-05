import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../context/AppContext";
import type { Interest } from "../lib/weather";

const interests: { id: Interest; title: string; icon: keyof typeof Feather.glyphMap; detail: string }[] = [
  { id: "fitness", title: "Fitness", icon: "activity", detail: "Runs & outdoor training" },
  { id: "travel", title: "Travel", icon: "navigation", detail: "Trips & getting around" },
  { id: "health", title: "Health", icon: "heart", detail: "Air & sun exposure" },
  { id: "farming", title: "Farming", icon: "sun", detail: "Rain & growing conditions" },
  { id: "commuting", title: "Commuting", icon: "map", detail: "Daily route conditions" },
  { id: "general", title: "Everyday", icon: "cloud", detail: "A little of everything" },
];
const activities = ["Running", "Walking", "Cycling", "Travel", "Gardening"];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { completeSetup } = useApp();
  const { isLoaded, isSignedIn } = useAuth();
  const [name, setName] = useState("");
  const [interest, setInterest] = useState<Interest>("fitness");
  const [activity, setActivity] = useState("Running");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  if (isLoaded && !isSignedIn) return <Redirect href="/sign-in" />;

  const finish = async () => {
    if (!name.trim()) {
      setError("Add your name to personalize your forecast.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await completeSetup(name, interest, activity);
      router.replace("/(tabs)");
    } catch {
      setError("Your profile could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={[styles.brand, { backgroundColor: colors.primary }]}>
        <View style={styles.brandMark}><Feather name="cloud-drizzle" size={22} color={colors.primaryForeground} /></View>
        <Text style={[styles.brandName, { color: colors.primaryForeground }]}>MAUSAM</Text>
        <Text style={[styles.brandLine, { color: colors.primaryForeground }]}>Your weather, made personal.</Text>
      </View>
      <Text style={[styles.welcome, { color: colors.foreground }]}>What matters to you?</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>We’ll bring the useful parts of the forecast to the top.</Text>
      <Text style={[styles.label, { color: colors.foreground }]}>YOUR NAME</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="What should we call you?"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        autoCapitalize="words"
        returnKeyType="done"
        testID="onboarding-name"
      />
      <Text style={[styles.label, { color: colors.foreground }]}>CHOOSE YOUR FOCUS</Text>
      <View style={styles.interestGrid}>
        {interests.map((item) => {
          const active = interest === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setInterest(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              testID={`interest-${item.id}`}
              style={[styles.interestCard, { backgroundColor: active ? colors.accent : colors.card, borderColor: active ? colors.primary : colors.border }]}
            >
              <Feather name={item.icon} size={19} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.interestTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.interestDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.label, { color: colors.foreground }]}>FAVORITE ACTIVITY</Text>
      <View style={styles.chips}>
        {activities.map((item) => (
          <Pressable key={item} onPress={() => setActivity(item)} style={[styles.chip, { backgroundColor: activity === item ? colors.primary : colors.card, borderColor: activity === item ? colors.primary : colors.border }]}>
            <Text style={{ color: activity === item ? colors.primaryForeground : colors.foreground, fontWeight: "600", fontSize: 13 }}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.note, { backgroundColor: colors.secondary }]}>
        <Feather name="map-pin" size={17} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.secondaryForeground }]}>We’ll start with Pune. You can change your location any time.</Text>
      </View>
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      <Pressable onPress={finish} disabled={saving} style={[styles.button, { backgroundColor: colors.primary, opacity: saving ? 0.65 : 1 }]} testID="finish-onboarding">
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{saving ? "Setting up…" : "See my weather"}</Text>
        <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
      </Pressable>
      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>Demo data is on to start. Switch to live weather in your profile.</Text>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 22, paddingBottom: 36, paddingTop: 22, maxWidth: 560, width: "100%", alignSelf: "center" },
  brand: { borderRadius: 26, padding: 22, minHeight: 148, justifyContent: "center", marginBottom: 27 },
  brandMark: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", marginBottom: 11 },
  brandName: { fontSize: 15, letterSpacing: 3.5, fontWeight: "800" },
  brandLine: { fontSize: 13, marginTop: 4, opacity: 0.82 },
  welcome: { fontSize: 25, lineHeight: 32, fontWeight: "700", letterSpacing: -0.6 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 21 },
  label: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800", marginBottom: 10, marginTop: 16 },
  input: { borderRadius: 14, borderWidth: 1, minHeight: 50, paddingHorizontal: 15, fontSize: 15 },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  interestCard: { width: "31.7%", minHeight: 100, borderWidth: 1, borderRadius: 16, padding: 11, justifyContent: "space-between" },
  interestTitle: { fontSize: 13, fontWeight: "700", marginTop: 7 },
  interestDetail: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 30, paddingHorizontal: 14, paddingVertical: 9 },
  note: { marginTop: 21, flexDirection: "row", gap: 10, alignItems: "center", padding: 13, borderRadius: 15 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  error: { fontSize: 12, marginTop: 12 },
  button: { marginTop: 19, minHeight: 54, borderRadius: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  buttonText: { fontSize: 15, fontWeight: "700" },
  footnote: { textAlign: "center", fontSize: 11, marginTop: 13 },
});
