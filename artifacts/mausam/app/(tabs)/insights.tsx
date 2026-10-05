import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../../context/AppContext";
import { personalizedInsights, aqiSummary } from "../../lib/recommendations";
import { aqiCategory, getWeather } from "../../lib/weather";
import { LoadingState, ScreenHeader } from "../../components/WeatherUI";

export default function InsightsScreen() {
  const colors = useColors();
  const { profile } = useApp();
  const place = profile?.activeLocation;
  const query = useQuery({
    queryKey: ["weather", place?.latitude, place?.longitude, profile?.useDemoData],
    queryFn: () => getWeather(place!, profile!.useDemoData),
    enabled: !!place && !!profile,
    staleTime: 10 * 60 * 1000,
  });
  const weather = query.data;
  const insights = weather ? personalizedInsights(weather, profile?.interest ?? "general", profile?.activity ?? "outdoor plans") : [];
  const air = aqiCategory(weather?.aqi ?? null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="My insights" subtitle="A forecast with a point of view" />
        <View style={[styles.intro, { backgroundColor: colors.primary }]}>
          <View style={[styles.introIcon, { backgroundColor: "rgba(255,255,255,0.16)" }]}><Feather name="star" size={20} color={colors.primaryForeground} /></View>
          <Text style={[styles.introTitle, { color: colors.primaryForeground }]}>A little more useful.</Text>
          <Text style={[styles.introCopy, { color: colors.primaryForeground }]}>Your {profile?.interest ?? "everyday"} forecast for {place?.name ?? "your location"}.</Text>
        </View>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <Text style={[styles.error, { color: colors.warning }]}>{query.error.message}</Text> : null}
        {weather ? (
          <>
            {insights.map((item, index) => (
              <View key={`${item.title}-${index}`} style={[styles.insight, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.insightIcon, { backgroundColor: item.tone === "caution" ? colors.accent : colors.secondary }]}>
                  <Feather name={item.icon as keyof typeof Feather.glyphMap} size={18} color={item.tone === "caution" ? colors.warning : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.insightCopy, { color: colors.mutedForeground }]}>{item.body}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.section, { color: colors.foreground }]}>Air & wellbeing</Text>
            <View style={[styles.airCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.airTop}>
                <View>
                  <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>AIR QUALITY</Text>
                  <Text style={[styles.airValue, { color: colors.foreground }]}>{weather.aqi === null ? "—" : weather.aqi}<Text style={[styles.airUnit, { color: colors.mutedForeground }]}> US AQI</Text></Text>
                </View>
                <View style={[styles.category, { backgroundColor: weather.aqi !== null && weather.aqi > 100 ? colors.accent : colors.secondary }]}>
                  <Text style={{ color: weather.aqi !== null && weather.aqi > 100 ? colors.warning : colors.primary, fontSize: 12, fontWeight: "700" }}>{air.label}</Text>
                </View>
              </View>
              <Text style={[styles.airAdvice, { color: colors.mutedForeground }]}>{aqiSummary(weather.aqi)}</Text>
              <View style={[styles.pollutants, { borderTopColor: colors.border }]}>
                <Text style={[styles.pollutant, { color: colors.foreground }]}>PM2.5  <Text style={{ color: colors.mutedForeground }}>{weather.pm25 === null ? "—" : `${weather.pm25} µg/m³`}</Text></Text>
                <Text style={[styles.pollutant, { color: colors.foreground }]}>PM10  <Text style={{ color: colors.mutedForeground }}>{weather.pm10 === null ? "—" : `${weather.pm10} µg/m³`}</Text></Text>
              </View>
            </View>
            <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
              <Feather name="sun" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.insightTitle, { color: colors.secondaryForeground }]}>Your day, in a sentence</Text>
                <Text style={[styles.insightCopy, { color: colors.mutedForeground }]}>
                  {weather.condition} at {weather.temperature}°, with {weather.rainChance}% rain chance. {weather.aqi !== null ? air.advice : "Air quality readings are unavailable."}
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, maxWidth: 700, width: "100%", alignSelf: "center" },
  intro: { borderRadius: 21, padding: 19, marginBottom: 8 },
  introIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  introTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
  introCopy: { fontSize: 13, opacity: 0.82, marginTop: 4 },
  insight: { flexDirection: "row", gap: 12, padding: 15, borderRadius: 18, borderWidth: 1, marginTop: 11 },
  insightIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  insightTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  insightCopy: { fontSize: 12, lineHeight: 18 },
  section: { fontSize: 18, fontWeight: "700", marginTop: 23, marginBottom: 11 },
  airCard: { borderRadius: 18, borderWidth: 1, padding: 17 },
  airTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: "800" },
  airValue: { fontSize: 29, fontWeight: "700", marginTop: 5 },
  airUnit: { fontSize: 11, fontWeight: "600" },
  category: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  airAdvice: { fontSize: 12, lineHeight: 19, marginTop: 10 },
  pollutants: { borderTopWidth: 1, paddingTop: 13, marginTop: 14, flexDirection: "row", justifyContent: "space-between" },
  pollutant: { fontSize: 11, fontWeight: "700" },
  summary: { flexDirection: "row", gap: 11, borderRadius: 17, padding: 15, marginTop: 15 },
  error: { marginTop: 20, fontSize: 14 },
});
