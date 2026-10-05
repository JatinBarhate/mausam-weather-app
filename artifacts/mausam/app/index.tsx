import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../context/AppContext";
import SignInScreen from "./sign-in";

export default function StartScreen() {
  const { profile, isLoading } = useApp();
  const colors = useColors();
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!isSignedIn) return <SignInScreen />;
  return <Redirect href={profile ? "/(tabs)" : "/onboarding"} />;
}
