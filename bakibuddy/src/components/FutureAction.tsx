import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

export function FutureAction({
  title,
  icon,
  phase,
}: {
  title: string;
  icon: IconName;
  phase: number;
}) {
  return (
    <Pressable
      disabled
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      aria-disabled
      accessibilityLabel={`${title}, unavailable until Phase ${phase}`}
      style={styles.action}
    >
      <View style={styles.icon}>
        <Icon name={icon} size={22} color={colors.secondary} />
      </View>
      <AppText variant="caption" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="caption" color={colors.secondary} style={styles.phase}>
        Phase {phase}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
    minWidth: 76,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: { fontWeight: "600", textAlign: "center" },
  phase: { fontSize: 11, textAlign: "center" },
});
