import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

export function FinancialCard({
  children,
  style,
  tone = "white",
  testID,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  tone?: "white" | "soft";
  testID?: string;
}>) {
  return (
    <View
      testID={testID}
      style={[styles.card, tone === "soft" && styles.soft, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  soft: { backgroundColor: colors.emeraldSoft },
});
