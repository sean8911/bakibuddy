import { Manrope_700Bold, useFonts } from "@expo-google-fonts/manrope";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors, layout } from "../theme/tokens";
import { FinanceProvider } from "../state/FinanceProvider";

export { ErrorBoundary } from "expo-router";
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.emerald,
    background: colors.background,
    card: colors.surface,
    text: colors.navy,
    border: colors.line,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_700Bold,
    ...Ionicons.font,
  });
  useEffect(() => {
    if (fontsLoaded || fontError)
      void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);
  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <View style={styles.canvas}>
          <View style={[styles.app, Platform.OS === "web" && styles.webApp]}>
            <StatusBar style="dark" />
            {!fontsLoaded && !fontError ? (
              <View
                style={styles.loading}
                accessibilityLabel="Loading BakiBuddy"
                accessibilityRole="progressbar"
              >
                <ActivityIndicator color={colors.emerald} size="large" />
              </View>
            ) : (
              <FinanceProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                  <Stack.Screen name="accounts" />
                  <Stack.Screen name="account/[id]" />
                  <Stack.Screen name="transaction/[id]" />
                  <Stack.Screen name="budget-plan" />
                  <Stack.Screen name="planned-items" />
                  <Stack.Screen name="planned/[id]" />
                  <Stack.Screen name="planned-payment" />
                  <Stack.Screen name="import-tng" />
                  <Stack.Screen name="scan-receipt" />
                  <Stack.Screen name="assistant" />
                  <Stack.Screen name="assistant-categories" />
                  <Stack.Screen name="data-privacy" />
                  <Stack.Screen name="login" />
                </Stack>
              </FinanceProvider>
            )}
          </View>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: colors.canvas, alignItems: "center" },
  app: { flex: 1, width: "100%", backgroundColor: colors.background },
  webApp: { maxWidth: layout.maxWidth },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
