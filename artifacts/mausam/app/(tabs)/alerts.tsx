import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../../context/AppContext";
import { relevantAlerts } from "../../lib/recommendations";
import { getWeather } from "../../lib/weather";
import { AlertRow, LoadingState, ScreenHeader } from "../../components/WeatherUI";

export default function AlertsScreen() {
  const colors = useColors();
  const { profile } = useApp();
  const place = profile?.activeLocation;
  const query = useQuery({
    queryKey: ["weather", place?.latitude, place?.longitude, profile?.useDemoData],
    queryFn: () => getWeather(place!, profile!.useDemoData),
    enabled: !!place && !!profile,
    staleTime: 10 * 60 * 1000,
  });
  const alerts = query.data ? relevantAlerts(query.data) : [];
  const activeCount = alerts.filter((alert) => alert.severity !== "low").length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Alerts" subtitle={place?.name ?? "Weather that matters to you"} />
        <View style={[styles.status, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statusIcon, { backgroundColor: activeCount ? colors.accent : colors.secondary }]}>
            <Feather name={activeCount ? "bell" : "check"} size={18} color={activeCount ? colors.warning : colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>{query.isLoading ? "Checking conditions" : activeCount ? `${activeCount} relevant ${activeCount === 1 ? "alert" : "alerts"}` : "All clear for now"}</Text>
            <Text style={[styles.statusCopy, { color: colors.mutedForeground }]}>Alerts are filtered for your location and interests.</Text>
          </View>
        </View>
        {query.isLoading ? <LoadingState label="Checking local conditions…" /> : null}
        {query.isError ? <Text style={[styles.error, { color: colors.warning }]}>{query.error.message}</Text> : null}
        {query.data ? (
          <>
            <Text style={[styles.section, { color: colors.foreground }]}>For you today</Text>
            {alerts.map((alert, index) => <AlertRow key={`${alert.title}-${index}`} alert={alert} />)}
          </>
        ) : null}
        <View style={[styles.delivery, { backgroundColor: colors.secondary }]}>
          <Feather name="smartphone" size={17} color={colors.primary} />
          <Text style={[styles.deliveryText, { color: colors.secondaryForeground }]}>
            In-app alerts are ready. Push delivery is kept separate and can be connected when notification credentials are configured.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, maxWidth: 700, width: "100%", alignSelf: "center" },
  status: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, padding: 15 },
  statusIcon: { width: 39, height: 39, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statusTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  statusCopy: { fontSize: 11, lineHeight: 16 },
  section: { fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12 },
  delivery: { flexDirection: "row", gap: 9, alignItems: "flex-start", borderRadius: 15, padding: 14, marginTop: 20 },
  deliveryText: { flex: 1, fontSize: 11, lineHeight: 17 },
  error: { marginTop: 20, fontSize: 14 },
});
