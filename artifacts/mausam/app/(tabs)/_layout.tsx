import React from "react";
import { ActivityIndicator, Platform, StyleSheet, useColorScheme, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect, Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { useAuth } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../../context/AppContext";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} /><NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="forecast"><NativeTabs.Trigger.Icon sf={{ default: "cloud.sun", selected: "cloud.sun.fill" }} /><NativeTabs.Trigger.Label>Forecast</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights"><NativeTabs.Trigger.Icon sf={{ default: "sparkles", selected: "sparkles" }} /><NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts"><NativeTabs.Trigger.Icon sf={{ default: "bell", selected: "bell.fill" }} /><NativeTabs.Trigger.Label>Alerts</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile"><NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} /><NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const icons = { index: "home", forecast: "cloud", insights: "sun", alerts: "bell", profile: "user" } as const;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginBottom: isWeb ? 12 : 2 },
        tabBarItemStyle: { paddingTop: isWeb ? 8 : 4 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : { height: 58 }),
        },
        tabBarBackground: () =>
          isIOS ? <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} /> :
          isWeb ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> : null,
        tabBarIcon: ({ color, size }) => {
          const name = icons[route.name as keyof typeof icons];
          return isIOS ? <SymbolView name={name === "home" ? "house" : name === "cloud" ? "cloud.sun" : name === "sun" ? "sparkles" : name === "bell" ? "bell" : "person.crop.circle"} tintColor={color} size={size} /> : <Feather name={name} size={20} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="forecast" options={{ title: "Forecast" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, isLoading } = useApp();
  if (!isLoaded || isLoading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  if (!profile) return <Redirect href="/onboarding" />;
  return isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
}
