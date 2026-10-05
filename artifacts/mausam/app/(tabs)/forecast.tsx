import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../../context/AppContext";
import { getWeather } from "../../lib/weather";
import { LoadingState, ScreenHeader, WeatherGlyph } from "../../components/WeatherUI";

export default function ForecastScreen() {
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} refreshControl={undefined}>
        <ScreenHeader title="Forecast" subtitle={place?.name ?? "Your week ahead"} />
        <Text style={[styles.dateLine, { color: colors.mutedForeground }]}>
          {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          {weather ? ` · ${weather.source === "demo" ? "Demo" : "Live"}` : ""}
        </Text>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <Text style={[styles.error, { color: colors.warning }]}>{query.error.message}</Text> : null}
        {weather ? (
          <>
            <Text style={[styles.section, { color: colors.foreground }]}>Today, by the hour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hours}>
              {weather.hourly.slice(0, 12).map((hour, index) => (
                <View key={`${hour.time}-${index}`} style={[styles.hour, { backgroundColor: index === 0 ? colors.primary : colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.hourTime, { color: index === 0 ? colors.primaryForeground : colors.mutedForeground }]}>{index === 0 ? "Now" : new Date(hour.time).toLocaleTimeString([], { hour: "numeric" })}</Text>
                  <WeatherGlyph code={hour.weatherCode} size={22} color={index === 0 ? colors.primaryForeground : colors.primary} />
                  <Text style={[styles.hourTemp, { color: index === 0 ? colors.primaryForeground : colors.foreground }]}>{hour.temperature}°</Text>
                  <View style={styles.rain}>
                    <Feather name="droplet" size={11} color={index === 0 ? colors.primaryForeground : colors.primary} />
                    <Text style={[styles.rainText, { color: index === 0 ? colors.primaryForeground : colors.mutedForeground }]}>{hour.rainChance}%</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Text style={[styles.section, { color: colors.foreground }]}>7-day outlook</Text>
            <View style={[styles.week, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {weather.daily.map((day, index) => (
                <View key={day.date} style={[styles.day, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.dayName, { color: colors.foreground }]}>{index === 0 ? "Today" : new Date(day.date).toLocaleDateString([], { weekday: "short" })}</Text>
                  <View style={styles.dayCenter}><WeatherGlyph code={day.weatherCode} size={21} color={colors.primary} /><Text style={[styles.rainText, { color: colors.mutedForeground }]}>{day.rainChance}% rain</Text></View>
                  <Text style={[styles.temps, { color: colors.mutedForeground }]}><Text style={{ color: colors.foreground }}>{day.high}°</Text>   {day.low}°</Text>
                </View>
              ))}
            </View>
            <View style={[styles.tip, { backgroundColor: colors.secondary }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.secondaryForeground }]}>Forecasts update from Open-Meteo in live mode. Air quality is shown on Home and Insights.</Text>
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
  dateLine: { fontSize: 13, marginTop: -13, marginBottom: 8 },
  section: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3, marginTop: 24, marginBottom: 12 },
  hours: { gap: 9, paddingRight: 4 },
  hour: { width: 72, alignItems: "center", gap: 10, borderRadius: 17, paddingVertical: 13, borderWidth: 1 },
  hourTime: { fontSize: 11, fontWeight: "600" },
  hourTemp: { fontSize: 17, fontWeight: "700" },
  rain: { flexDirection: "row", alignItems: "center", gap: 2 },
  rainText: { fontSize: 10, fontWeight: "600" },
  week: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 15 },
  day: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayName: { width: 58, fontSize: 13, fontWeight: "600" },
  dayCenter: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1, paddingLeft: 8 },
  temps: { fontSize: 12, fontWeight: "600" },
  tip: { marginTop: 17, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  error: { marginTop: 20, fontSize: 14 },
});
