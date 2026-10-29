import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, layout, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Brand } from "./Brand";
import { LocalBadge } from "./LocalBadge";

export function Screen({
  children,
  title,
  subtitle,
  home = false,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  home?: boolean;
}>) {
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: width < layout.compactWidth ? 16 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.topbar}>
          <Brand />
          <LocalBadge />
        </View>
        <View style={styles.heading}>
          <AppText
            variant="heading"
            accessibilityRole="header"
            testID="screen-title"
          >
            {title}
          </AppText>
          {subtitle && (
            <AppText color={colors.secondary} style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
          {home && (
            <View style={styles.greetingNote}>
              <View style={styles.greetingDot} />
              <AppText variant="caption" color={colors.emerald}>
                A fresh week. A little more clarity.
              </AppText>
            </View>
          )}
        </View>
        {children}
        <View style={styles.footer}>
          <AppText
            variant="caption"
            color={colors.secondary}
            style={styles.footerText}
          >
            Saved on this device · MYR · Kuala Lumpur
          </AppText>
          <AppText
            variant="caption"
            color={colors.muted}
            style={styles.footerText}
          >
            Made for your everyday, in Malaysia.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginBottom: spacing.xxl,
  },
  heading: { marginBottom: spacing.xl },
  subtitle: { marginTop: 6 },
  greetingNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  greetingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  footer: { paddingTop: spacing.section, gap: spacing.xs },
  footerText: { textAlign: "center" },
});
