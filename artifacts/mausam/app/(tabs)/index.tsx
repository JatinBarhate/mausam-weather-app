import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../../context/AppContext";
import { personalizedInsights } from "../../lib/recommendations";
import { aqiCategory, getWeather } from "../../lib/weather";
import { ErrorNotice, MetricTile, ScreenHeader, SectionHeading, WeatherGlyph } from "../../components/WeatherUI";

function hourLabel(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric" });
}

export default function HomeScreen() {
  const colors = useColors();
  const { profile } = useApp();
  const place = profile?.activeLocation;
  const weatherQuery = useQuery({
    queryKey: ["weather", place?.latitude, place?.longitude, profile?.useDemoData],
    queryFn: () => getWeather(place!, profile!.useDemoData),
    enabled: !!place && !!profile,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
  const weather = weatherQuery.data;
  const insight = useMemo(
    () => weather ? personalizedInsights(weather, profile?.interest ?? "general", profile?.activity ?? "outdoor plans")[0] : null,
    [weather, profile?.interest, profile?.activity],
  );
  const air = aqiCategory(weather?.aqi ?? null);
  const priority = profile?.interest === "fitness"
    ? ["UV index", "Air quality", "Humidity", "Wind"]
    : profile?.interest === "travel"
      ? ["Rain chance", "Visibility", "Wind", "Air quality"]
      : profile?.interest === "health"
        ? ["Air quality", "UV index", "Humidity", "Feels like"]
        : profile?.interest === "farming"
          ? ["Rain chance", "Humidity", "Feels like", "Wind"]
          : profile?.interest === "commuting"
            ? ["Rain chance", "Visibility", "Wind", "Feels like"]
            : ["Feels like", "Rain chance", "Air quality", "UV index"];
  const metrics = weather ? {
    "Feels like": [`${weather.feelsLike}°`, `Humidity ${weather.humidity}%`, "thermometer"],
    "Humidity": [`${weather.humidity}%`, "Relative humidity", "droplet"],
    "Wind": [`${weather.windSpeed} km/h`, "Current speed", "wind"],
    "Rain chance": [`${weather.rainChance}%`, "Today", "cloud-rain"],
    "UV index": [String(weather.uvIndex), weather.uvIndex >= 8 ? "High · protect your skin" : "Today's peak", "sun"],
    "Air quality": [weather.aqi === null ? "—" : String(weather.aqi), air.label, "activity"],
    "Visibility": [`${(weather.visibility / 1000).toFixed(1)} km`, weather.visibility < 3000 ? "Take care on the road" : "Good visibility", "eye"],
  } as Record<string, [string, string, "thermometer" | "droplet" | "wind" | "cloud-rain" | "sun" | "activity" | "eye"]> : {};

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={`Hello${profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}`}
          subtitle={new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          right={
            <View style={[styles.modePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.modeDot, { backgroundColor: weather?.source === "live" ? colors.success : colors.warning }]} />
              <Text style={[styles.modeText, { color: colors.foreground }]}>{weather?.source === "live" ? "LIVE" : "DEMO"}</Text>
            </View>
          }
        />
        {weather ? (
          <>
            <LinearGradient colors={[colors.primary, colors.primary]} style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.location, { color: colors.primaryForeground }]}>{weather.location.name}</Text>
                  <Text style={[styles.country, { color: colors.primaryForeground }]}>{weather.location.country ?? "India"}</Text>
                </View>
                <View style={styles.heroLocationButton}><Feather name="map-pin" size={17} color={colors.primaryForeground} /></View>
              </View>
              <View style={styles.weatherMain}>
                <View>
                  <Text style={[styles.temperature, { color: colors.primaryForeground }]}>{weather.temperature}°</Text>
                  <Text style={[styles.condition, { color: colors.primaryForeground }]}>{weather.condition}</Text>
                  <Text style={[styles.feels, { color: colors.primaryForeground }]}>Feels like {weather.feelsLike}°</Text>
                </View>
                <WeatherGlyph code={weather.weatherCode} size={72} color={colors.primaryForeground} />
              </View>
              <View style={styles.heroFooter}>
                <View style={styles.heroStat}><Feather name="droplet" size={14} color={colors.primaryForeground} /><Text style={[styles.heroStatText, { color: colors.primaryForeground }]}>{weather.humidity}% humidity</Text></View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}><Feather name="wind" size={14} color={colors.primaryForeground} /><Text style={[styles.heroStatText, { color: colors.primaryForeground }]}>{weather.windSpeed} km/h wind</Text></View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}><Feather name="cloud-rain" size={14} color={colors.primaryForeground} /><Text style={[styles.heroStatText, { color: colors.primaryForeground }]}>{weather.rainChance}% rain</Text></View>
              </View>
            </LinearGradient>
            {insight ? (
              <View style={[styles.recommendation, { backgroundColor: colors.accent }]}>
                <View style={[styles.recommendIcon, { backgroundColor: colors.card }]}><Feather name={insight.icon as keyof typeof Feather.glyphMap} size={18} color={colors.warning} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recommendEyebrow, { color: colors.warning }]}>MAUSAM FOR YOU</Text>
                  <Text style={[styles.recommendTitle, { color: colors.foreground }]}>{insight.title}</Text>
                  <Text style={[styles.recommendBody, { color: colors.foreground }]}>{insight.body}</Text>
                </View>
              </View>
            ) : null}
            <SectionHeading title="Your conditions" />
            <View style={styles.metricGrid}>
              {priority.map((label) => {
                const item = metrics[label];
                return item ? <MetricTile key={label} icon={item[2]} label={label} value={item[0]} detail={item[1]} /> : null;
              })}
            </View>
            <SectionHeading title="The next few hours" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourly}>
              {weather.hourly.slice(0, 8).map((hour, index) => (
                <View key={`${hour.time}-${index}`} style={[styles.hourItem, { backgroundColor: index === 0 ? colors.secondary : colors.card }]}>
                  <Text style={[styles.hourLabel, { color: colors.mutedForeground }]}>{index === 0 ? "Now" : hourLabel(hour.time)}</Text>
                  <WeatherGlyph code={hour.weatherCode} size={23} color={colors.primary} />
                  <Text style={[styles.hourTemp, { color: colors.foreground }]}>{hour.temperature}°</Text>
                  <Text style={[styles.hourRain, { color: colors.mutedForeground }]}>{hour.rainChance}%</Text>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.sourceNote, { backgroundColor: colors.secondary }]}>
              <Feather name="info" size={13} color={colors.primary} />
              <Text style={[styles.sourceText, { color: colors.secondaryForeground }]}>
                {weather.source === "demo" ? "Sample conditions for your demo city." : `Open-Meteo · Updated ${new Date(weather.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
              </Text>
              <Pressable onPress={() => void weatherQuery.refetch()} accessibilityLabel="Refresh weather"><Feather name="refresh-cw" size={14} color={colors.primary} /></Pressable>
            </View>
          </>
        ) : null}
        {weatherQuery.isLoading ? <View style={styles.loading}><Text style={[styles.loadingTitle, { color: colors.foreground }]}>Reading the sky…</Text><Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Getting conditions for {place?.name ?? "your location"}</Text></View> : null}
        {weatherQuery.isError ? <ErrorNotice message={weatherQuery.error.message} onRetry={() => void weatherQuery.refetch()} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, maxWidth: 700, width: "100%", alignSelf: "center" },
  modePill: { borderWidth: 1, borderRadius: 30, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontSize: 9, letterSpacing: 1, fontWeight: "800" },
  hero: { borderRadius: 23, padding: 20, overflow: "hidden" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  location: { fontSize: 16, fontWeight: "700" },
  country: { fontSize: 11, opacity: 0.72, marginTop: 3 },
  heroLocationButton: { padding: 8 },
  weatherMain: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 15, paddingBottom: 15, paddingRight: 8 },
  temperature: { fontSize: 62, lineHeight: 68, fontWeight: "700", letterSpacing: -2.5 },
  condition: { fontSize: 14, fontWeight: "600" },
  feels: { fontSize: 11, opacity: 0.76, marginTop: 4 },
  heroFooter: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)", paddingTop: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5 },
  heroStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroStatText: { fontSize: 10, fontWeight: "600" },
  heroDivider: { width: 1, height: 14, backgroundColor: "rgba(255,255,255,0.25)" },
  recommendation: { borderRadius: 18, padding: 15, marginTop: 12, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  recommendIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  recommendEyebrow: { fontSize: 9, letterSpacing: 1.3, fontWeight: "800", marginBottom: 4 },
  recommendTitle: { fontSize: 14, fontWeight: "700" },
  recommendBody: { fontSize: 11, lineHeight: 17, marginTop: 4, opacity: 0.82 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  hourly: { gap: 8, paddingRight: 4 },
  hourItem: { width: 63, borderRadius: 15, minHeight: 105, alignItems: "center", justifyContent: "space-around", paddingVertical: 10 },
  hourLabel: { fontSize: 10, fontWeight: "600" },
  hourTemp: { fontSize: 14, fontWeight: "700" },
  hourRain: { fontSize: 10 },
  sourceNote: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 10, marginTop: 19 },
  sourceText: { fontSize: 10, flex: 1 },
  loading: { flex: 1, minHeight: 400, alignItems: "center", justifyContent: "center", gap: 8 },
  loadingTitle: { fontSize: 18, fontWeight: "700" },
});
