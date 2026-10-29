import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

export function EmptyState({
  title,
  description,
  icon = "bar-chart-outline",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.symbol}>
        <Icon name={icon} size={34} color={colors.emerald} />
      </View>
      <AppText variant="title" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      <AppText color={colors.secondary} style={styles.center}>
        {description}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  symbol: {
    backgroundColor: colors.emeraldSoft,
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  center: { textAlign: "center", maxWidth: 320 },
});
