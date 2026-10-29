import { Pressable, StyleSheet, View } from "react-native";

import { colors, layout, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

export function AppButton({
  label,
  onPress,
  icon,
  disabled = false,
  variant = "primary",
  hint,
  testID,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  hint?: string;
  testID?: string;
}) {
  const secondary = variant === "secondary";
  const color = disabled
    ? colors.secondary
    : secondary
      ? colors.emerald
      : colors.surface;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        variant === "danger" && { backgroundColor: colors.orange },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon && <Icon name={icon} color={color} size={19} />}
      <View style={styles.label}>
        <AppText variant="label" color={color} style={styles.text}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: layout.targetSize,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.emerald,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  secondary: { backgroundColor: colors.emeraldSoft },
  disabled: { backgroundColor: colors.graySoft },
  pressed: { opacity: 0.72 },
  label: { flexShrink: 1 },
  text: { textAlign: "center" },
});
