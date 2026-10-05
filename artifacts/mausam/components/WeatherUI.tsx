import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { WeatherAlert } from "../lib/recommendations";

export function WeatherGlyph({ code, size = 28, color }: { code: number; size?: number; color: string }) {
  const name =
    code === 0 ? "weather-sunny" :
    code <= 2 ? "weather-partly-cloudy" :
    code === 3 ? "weather-cloudy" :
    code === 45 || code === 48 ? "weather-fog" :
    code >= 51 && code <= 57 ? "weather-hazy" :
    code >= 61 && code <= 82 ? "weather-rainy" :
    code >= 95 ? "weather-lightning-rainy" : "weather-cloudy";
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action ? <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text> : null}
    </View>
  );
}

export function MetricTile({ icon, label, value, detail, style }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  detail?: string;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <View style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <View style={styles.metricTop}>
        <Feather name={icon} size={16} color={colors.primary} />
        <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      {detail ? <Text style={[styles.metricDetail, { color: colors.mutedForeground }]}>{detail}</Text> : null}
    </View>
  );
}

export function AlertRow({ alert }: { alert: WeatherAlert }) {
  const colors = useColors();
  const tint = alert.severity === "high" ? colors.destructive : alert.severity === "medium" ? colors.warning : colors.primary;
  return (
    <View style={[styles.alertRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.alertIcon, { backgroundColor: `${tint}18` }]}>
        <Feather name={alert.icon as keyof typeof Feather.glyphMap} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertTitle, { color: colors.foreground }]}>{alert.title}</Text>
        <Text style={[styles.alertDetail, { color: colors.mutedForeground }]}>{alert.detail}</Text>
      </View>
    </View>
  );
}

export function LoadingState({ label = "Getting your forecast…" }: { label?: string }) {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.mutedForeground }}>{label}</Text></View>;
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="cloud-off" size={22} color={colors.warning} />
      <Text style={[styles.alertDetail, { color: colors.foreground, flex: 1 }]}>{message}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button"><Text style={{ color: colors.primary, fontWeight: "700" }}>Retry</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 14 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.7, textTransform: "uppercase", marginBottom: 5 },
  headerTitle: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.6 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  sectionAction: { fontSize: 13, fontWeight: "600" },
  metric: { flex: 1, minWidth: "46%", borderWidth: 1, borderRadius: 18, padding: 15, gap: 8 },
  metricTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  metricLabel: { fontSize: 12, fontWeight: "600" },
  metricValue: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  metricDetail: { fontSize: 11, lineHeight: 15 },
  alertRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 10 },
  alertIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  alertDetail: { fontSize: 12, lineHeight: 18 },
  loading: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 12 },
  errorBox: { flexDirection: "row", gap: 12, alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 12 },
});
