import { StyleSheet, View } from "react-native";

import { colors, radius } from "../theme/tokens";

export function ProgressIndicator({
  value,
  label,
  color = colors.emerald,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const safeValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: safeValue }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      style={styles.track}
    >
      <View
        style={[
          styles.fill,
          { width: `${safeValue}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },
});
