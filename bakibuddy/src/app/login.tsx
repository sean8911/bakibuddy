import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentRef } from "react";
import { AppState, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { Brand } from "../components/Brand";
import { Field } from "../components/FormFields";
import { Icon } from "../components/Icon";
import { WelcomeOpening } from "../components/WelcomeOpening";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { colors, layout, spacing } from "../theme/tokens";

const ignorePreviewInput = () => undefined;

export default function LoginScreen() {
  const router = useRouter();
  const [opening, setOpening] = useState(true);
  const [replay, setReplay] = useState(0);
  const finishOpening = useCallback(() => setOpening(false), []);
  const { skipDecorativeMotion } = useMotionPreference(finishOpening);
  const showOpening = opening && !skipDecorativeMotion;
  const background = useRef<ComponentRef<typeof View>>(null);
  const closeControl = useRef<ComponentRef<typeof View>>(null);

  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    const element = background.current;
    if (!(element instanceof HTMLElement)) return;
    element.inert = showOpening;
    return () => { element.inert = false; };
  }, [showOpening]);

  useFocusEffect(useCallback(() => finishOpening, [finishOpening]));
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") finishOpening();
    });
    return () => listener.remove();
  }, [finishOpening]);

  return (
    <SafeAreaView style={[styles.safe, showOpening && styles.openingSafe]} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style={showOpening ? "light" : "dark"} />
      <View style={styles.fill}>
        <View
          ref={background}
          style={styles.fill}
          importantForAccessibility={showOpening ? "no-hide-descendants" : "auto"}
          accessibilityElementsHidden={showOpening}
          aria-hidden={showOpening}
          pointerEvents={showOpening ? "none" : "auto"}
        >
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.stage}>
            <View style={styles.header}>
              <Brand inverted />
              <Pressable
                ref={closeControl}
                accessibilityRole="button"
                accessibilityLabel="Close login preview"
                onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
                style={({ pressed }) => [styles.close, pressed && styles.pressed]}
              >
                <Icon name="close" color={colors.surface} size={23} />
              </Pressable>
            </View>
            <AppText variant="display" color={colors.surface} style={styles.headline}>
              Know your{"\n"}
              <AppText variant="display" color={colors.mint}>balance.</AppText>
            </AppText>
            <AppText color={colors.onEmerald} style={styles.stageCopy}>
              Own your future, one day at a time.
            </AppText>
          </View>

          <View style={styles.entry}>
            <View style={styles.introduction}>
              <AppText variant="heading" accessibilityRole="header" testID="login-title">
                Welcome back.
              </AppText>
              <AppText color={colors.secondary}>
                Email sign-in is coming later. For now, continue as a guest.
              </AppText>
            </View>
            <Field
              label="Email address"
              value=""
              placeholder="you@example.com"
              onChangeText={ignorePreviewInput}
              keyboardType="email-address"
              disabled
            />
            <Field
              label="Password"
              value=""
              placeholder="Unavailable in this preview"
              onChangeText={ignorePreviewInput}
              secureTextEntry
              disabled
            />
            <View style={styles.actions}>
              <AppButton label="Sign in · Coming later" disabled />
              <AppButton
                label="Continue as guest"
                icon="arrow-forward"
                onPress={() => router.replace("/")}
                hint="Open your existing local records without an account."
                testID="continue-as-guest"
              />
            </View>
            <AppText variant="caption" color={colors.secondary} style={styles.footer}>
              Basic budgeting works without an account.{"\n"}
              Your records are saved on this device.
            </AppText>
            <AppButton
              label="Replay opening animation"
              variant="secondary"
              icon="refresh-outline"
              disabled={skipDecorativeMotion}
              onPress={() => { setReplay((value) => value + 1); setOpening(true); }}
            />
            {skipDecorativeMotion && (
              <AppText variant="caption" color={colors.secondary}>
                The opening animation is off for your accessibility preferences.
              </AppText>
            )}
          </View>
        </ScrollView>
        </View>
        {showOpening && <WelcomeOpening key={replay} onFinish={finishOpening} settledControl={closeControl} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  openingSafe: { backgroundColor: colors.emerald },
  fill: { flex: 1 },
  content: { flexGrow: 1, width: "100%", maxWidth: layout.maxWidth, alignSelf: "center" },
  stage: { backgroundColor: colors.emerald, padding: spacing.xl, paddingTop: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  close: { minWidth: layout.targetSize, minHeight: layout.targetSize, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.72 },
  headline: { marginTop: spacing.xl },
  stageCopy: { marginTop: spacing.sm, marginBottom: spacing.sm },
  entry: { padding: spacing.xl, gap: spacing.lg },
  introduction: { gap: spacing.sm },
  actions: { gap: spacing.md },
  footer: { textAlign: "center" },
});
