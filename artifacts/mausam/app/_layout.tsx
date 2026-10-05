import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { AppProvider } from '../context/AppContext';
import { useColors } from '@/hooks/useColors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
if (!clerkPublishableKey) {
  throw new Error('Missing Clerk publishable key. Check the MAUSAM Expo workflow environment.');
}
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL ?? '';

function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return <AppProvider userId={userId ?? null}>{children}</AppProvider>;
}

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1, paddingTop: Platform.OS === 'web' ? 67 : 0 }}>
            <KeyboardProvider>
              <ClerkProvider
                publishableKey={clerkPublishableKey}
                tokenCache={tokenCache}
                proxyUrl={clerkProxyUrl}
              >
                <ClerkLoaded>
                  <AuthStateProvider>
                    <RootLayoutNav />
                  </AuthStateProvider>
                </ClerkLoaded>
              </ClerkProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
