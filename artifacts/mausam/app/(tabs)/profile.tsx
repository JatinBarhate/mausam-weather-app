import React, { useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useClerk, useUser } from "@clerk/expo";
import * as DeviceLocation from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../../context/AppContext";
import { searchPlaces, type Interest, type Location } from "../../lib/weather";
import { ScreenHeader } from "../../components/WeatherUI";

const focusOptions: { id: Interest; name: string }[] = [
  { id: "fitness", name: "Fitness" }, { id: "travel", name: "Travel" },
  { id: "health", name: "Health" }, { id: "farming", name: "Farming" },
  { id: "commuting", name: "Commuting" }, { id: "general", name: "Everyday" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile, updateProfile, setActiveLocation, addLocation, removeLocation, syncWarning, clearSyncWarning } = useApp();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [searching, setSearching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  if (!profile) return null;
  const findPlaces = async () => {
    if (search.trim().length < 2) {
      setLocationError("Type at least two characters to search.");
      return;
    }
    setSearching(true);
    setLocationError("");
    try {
      setResults(await searchPlaces(search));
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Could not search locations.");
    } finally {
      setSearching(false);
    }
  };
  const useDeviceLocation = async () => {
    if (Platform.OS === "web") {
      setLocationError("Location detection is available in the mobile app. Search for a city instead.");
      return;
    }
    setLoadingLocation(true);
    setLocationError("");
    try {
      const permission = await DeviceLocation.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError("Location permission was not granted. Search for a city instead.");
        return;
      }
      const position = await DeviceLocation.getCurrentPositionAsync({ accuracy: DeviceLocation.Accuracy.Balanced });
      const nearest = {
        id: `current-${Date.now()}`,
        name: "Current location",
        country: "Nearby",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      await setActiveLocation(nearest);
      setResults([]);
    } catch {
      setLocationError("Could not detect your location. You can search for a city instead.");
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Your profile" subtitle="Make MAUSAM yours" />
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}><Text style={[styles.avatarText, { color: colors.primary }]}>{profile.name.trim().charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.primaryForeground }]}>{profile.name}</Text>
            <Text style={[styles.current, { color: colors.primaryForeground }]}>{profile.activeLocation.name} · {profile.interest}</Text>
            <Text style={[styles.accountEmail, { color: colors.primaryForeground }]}>{user?.primaryEmailAddress?.emailAddress ?? "Signed-in MAUSAM account"}</Text>
          </View>
          <Feather name="cloud-drizzle" size={22} color={colors.primaryForeground} />
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Your weather focus</Text>
        <View style={styles.focusGrid}>
          {focusOptions.map((item) => {
            const active = profile.interest === item.id;
            return <Pressable key={item.id} onPress={() => void updateProfile({ interest: item.id })} style={[styles.focus, { backgroundColor: active ? colors.accent : colors.card, borderColor: active ? colors.primary : colors.border }]}>
              <Text style={{ color: active ? colors.primary : colors.foreground, fontSize: 12, fontWeight: "700" }}>{item.name}</Text>
              {active ? <Feather name="check" size={14} color={colors.primary} /> : null}
            </Pressable>;
          })}
        </View>
        <Text style={[styles.section, { color: colors.foreground }]}>Forecast settings</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Feather name="database" size={16} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Demo data</Text>
              <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{profile.useDemoData ? "Showing sample weather for Pune-region cities" : "Fetching live weather and air quality"}</Text>
            </View>
            <Switch value={profile.useDemoData} onValueChange={(value) => void updateProfile({ useDemoData: value })} trackColor={{ true: colors.primary }} testID="demo-mode-toggle" />
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Feather name="bell" size={16} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Weather notifications</Text>
              <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>Choose whether weather alerts are relevant to you</Text>
            </View>
            <Switch value={profile.notificationsEnabled} onValueChange={(value) => void updateProfile({ notificationsEnabled: value })} trackColor={{ true: colors.primary }} testID="notifications-toggle" />
          </View>
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Saved places</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {profile.savedLocations.map((place, index) => (
            <View key={place.id} style={[styles.placeRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Pressable onPress={() => void setActiveLocation(place)} style={styles.placeSelect} accessibilityRole="button" testID={`place-${place.id}`}>
                <Feather name={place.id === profile.activeLocation.id ? "map-pin" : "map"} size={16} color={place.id === profile.activeLocation.id ? colors.primary : colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>{place.name}</Text>
                  <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{place.country ?? `${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`}</Text>
                </View>
                {place.id === profile.activeLocation.id ? <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 11 }}>ACTIVE</Text> : null}
              </Pressable>
              {profile.savedLocations.length > 1 ? <Pressable onPress={() => void removeLocation(place.id)} hitSlop={10} accessibilityLabel={`Remove ${place.name}`}><Feather name="x" size={16} color={colors.mutedForeground} /></Pressable> : null}
            </View>
          ))}
        </View>

        <View style={styles.searchHeader}>
          <Text style={[styles.section, { color: colors.foreground, marginBottom: 0 }]}>Add a location</Text>
          <Pressable onPress={useDeviceLocation} disabled={loadingLocation} style={styles.locateButton} accessibilityRole="button">
            {loadingLocation ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="crosshair" size={15} color={colors.primary} />}
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 11 }}>Use my location</Text>
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => void findPlaces()} placeholder="Search city or town" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} returnKeyType="search" />
          <Pressable onPress={() => void findPlaces()} disabled={searching} style={[styles.searchButton, { backgroundColor: colors.primary }]} accessibilityRole="button" testID="search-location">
            {searching ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Feather name="search" size={17} color={colors.primaryForeground} />}
          </Pressable>
        </View>
        {locationError ? <Text style={[styles.errorText, { color: colors.warning }]}>{locationError}</Text> : null}
        {results.map((place) => (
          <Pressable key={place.id} onPress={async () => { await addLocation(place); setResults([]); setSearch(""); }} style={[styles.result, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.settingTitle, { color: colors.foreground, flex: 1 }]}>{place.name}</Text>
            <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{place.country}</Text>
            <Feather name="plus" size={17} color={colors.primary} />
          </Pressable>
        ))}
        {syncWarning ? (
          <Pressable onPress={clearSyncWarning} style={[styles.syncWarning, { backgroundColor: colors.accent }]}>
            <Feather name="cloud-off" size={15} color={colors.warning} />
            <Text style={{ color: colors.foreground, flex: 1, fontSize: 11, lineHeight: 16 }}>{syncWarning}</Text>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>MAUSAM · A little weather, a lot more useful.</Text>
        <Pressable
          onPress={() => void signOut()}
          accessibilityRole="button"
          style={[styles.signOut, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Feather name="log-out" size={15} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, maxWidth: 700, width: "100%", alignSelf: "center" },
  profileCard: { borderRadius: 20, padding: 17, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 45, height: 45, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 19, fontWeight: "800" },
  name: { fontSize: 17, fontWeight: "700" },
  current: { fontSize: 11, opacity: 0.78, marginTop: 3, textTransform: "capitalize" },
  accountEmail: { fontSize: 10, opacity: 0.72, marginTop: 4 },
  section: { fontSize: 17, fontWeight: "700", marginTop: 23, marginBottom: 11 },
  focusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  focus: { width: "31.7%", minHeight: 41, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 13 },
  settingsCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 14 },
  settingIcon: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingTitle: { fontSize: 13, fontWeight: "700" },
  settingSub: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  separator: { height: 1, marginLeft: 46 },
  placeRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 10 },
  placeSelect: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingVertical: 12 },
  searchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  locateButton: { flexDirection: "row", gap: 6, alignItems: "center" },
  searchRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  searchInput: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, flex: 1, height: 47, fontSize: 13 },
  searchButton: { width: 47, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  result: { minHeight: 50, borderWidth: 1, borderRadius: 13, marginTop: 7, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  errorText: { fontSize: 12, marginTop: 8 },
  syncWarning: { flexDirection: "row", alignItems: "center", gap: 9, padding: 12, borderRadius: 13, marginTop: 17 },
  footer: { textAlign: "center", fontSize: 10, marginTop: 28 },
  signOut: { minHeight: 44, borderWidth: 1, borderRadius: 13, marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  signOutText: { fontSize: 12, fontWeight: "700" },
});
