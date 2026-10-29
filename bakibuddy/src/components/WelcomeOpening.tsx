import { useEffect, useLayoutEffect, useRef, type ComponentRef, type RefObject } from "react";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, layout, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

export function WelcomeOpening({ onFinish, settledControl }: {
  onFinish: () => void;
  settledControl: RefObject<ComponentRef<typeof View> | null>;
}) {
  const progress = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 480;
  const skipControl = useRef<ComponentRef<typeof View>>(null);

  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    const previousFocus = document.activeElement;
    const fallbackFocus = settledControl.current;
    skipControl.current?.focus();
    const keepFocus = (event: KeyboardEvent) => {
      if (event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        skipControl.current?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onFinish();
      }
    };
    document.addEventListener("keydown", keepFocus, true);
    return () => {
      document.removeEventListener("keydown", keepFocus, true);
      // Wait until the parent's inert state is removed; never focus a departed route.
      requestAnimationFrame(() => {
        if (document.visibilityState !== "visible") return;
        const previousAvailable = previousFocus instanceof HTMLElement &&
          previousFocus !== document.body && previousFocus.isConnected &&
          previousFocus.getClientRects().length > 0 &&
          !previousFocus.closest('[inert], [aria-hidden="true"]');
        const target = previousAvailable ? previousFocus : fallbackFocus;
        if (target instanceof HTMLElement && target.isConnected &&
          target.getClientRects().length > 0 &&
          !target.closest('[inert], [aria-hidden="true"]')) {
          target.focus({ preventScroll: true });
        }
      });
    };
  }, [onFinish, settledControl]);

  useEffect(() => {
    // A timer also releases the screen if visual completion is interrupted.
    const finish = setTimeout(onFinish, 1150);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 1100,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.System,
    });
    return () => {
      clearTimeout(finish);
      cancelAnimation(progress);
    };
  }, [onFinish, progress]);

  const curtain = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]),
  }));
  const mark = useAnimatedStyle(() => {
    const arrival = Easing.out(Easing.exp)(Math.min(1, progress.value / 0.65));
    return {
    transform: [
      { perspective: 700 },
      { rotateY: `${-65 * (1 - arrival)}deg` },
      { scale: 0.78 + 0.22 * arrival },
    ],
    };
  });
  const back = useAnimatedStyle(() => {
    const arrival = Easing.out(Easing.exp)(Math.min(1, progress.value / 0.65));
    return {
    transform: [
      { translateX: -28 + 16 * arrival },
      { translateY: -12 },
      { rotate: `${-22 + 13 * arrival}deg` },
    ],
    };
  });
  const front = useAnimatedStyle(() => {
    const arrival = Easing.out(Easing.exp)(Math.min(1, progress.value / 0.65));
    return {
    transform: [
      { translateX: 28 - 16 * arrival },
      { translateY: 12 },
      { rotate: `${22 - 13 * arrival}deg` },
    ],
    };
  });

  return (
    <Animated.View
      style={[styles.overlay, curtain]}
      accessibilityViewIsModal
      role="dialog"
      aria-modal
      accessibilityLabel="Opening BakiBuddy"
      testID="welcome-opening"
    >
      <View style={[styles.center, compact && styles.centerCompact]} accessible={false}>
        <View
          style={styles.symbol}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          <Animated.View style={[styles.tile, styles.back, back]} />
          <Animated.View style={[styles.tile, styles.front, front]} />
          <Animated.View style={[styles.tile, styles.mark, mark]}>
            <Icon name="wallet-outline" size={54} color={colors.emerald} />
          </Animated.View>
        </View>
        <View style={styles.copy}>
          <AppText variant="heading" color={colors.surface} style={[styles.name, compact && styles.compactName]}>
            BakiBuddy.
          </AppText>
          <AppText color={colors.onEmerald} style={styles.tagline}>
            Know your balance. Own your future.
          </AppText>
        </View>
      </View>
      <Pressable
        ref={skipControl}
        accessibilityRole="button"
        accessibilityLabel="Skip opening animation"
        onPress={onFinish}
        style={({ pressed }) => [
          styles.skip,
          { bottom: insets.bottom + spacing.xl },
          pressed && styles.pressed,
        ]}
      >
        <AppText variant="label" color={colors.surface}>Skip intro</AppText>
        <Icon name="arrow-forward" color={colors.surface} size={18} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: colors.emerald,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  center: { alignItems: "center", width: "100%", paddingBottom: 48 },
  centerCompact: { flexDirection: "row", gap: spacing.xl, paddingBottom: 72 },
  copy: { alignItems: "center", flexShrink: 1 },
  symbol: { width: 136, height: 136, alignItems: "center", justifyContent: "center" },
  tile: { width: 96, height: 96, borderRadius: radius.lg, position: "absolute" },
  back: { backgroundColor: colors.onEmerald, opacity: 0.25 },
  front: { backgroundColor: colors.mint, opacity: 0.4 },
  mark: { backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  name: { marginTop: spacing.xl, textAlign: "center" },
  compactName: { marginTop: 0 },
  tagline: { marginTop: spacing.sm, textAlign: "center", maxWidth: 300 },
  skip: {
    position: "absolute",
    minHeight: layout.targetSize,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.onEmerald,
  },
  pressed: { opacity: 0.72 },
});
