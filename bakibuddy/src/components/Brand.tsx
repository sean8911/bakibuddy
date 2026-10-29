import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

export function Brand({ large = false, inverted = false }: { large?: boolean; inverted?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, large && styles.largeMark, inverted && styles.invertedMark]}>
        <Icon
          name="wallet-outline"
          color={inverted ? colors.emerald : colors.mint}
          size={large ? 30 : 23}
        />
      </View>
      <AppText variant={large ? "heading" : "title"} color={inverted ? colors.surface : colors.navy} style={styles.wordmark}>
        BakiBuddy
        <AppText variant={large ? "heading" : "title"} color={inverted ? colors.mint : colors.emerald}>
          .
        </AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    flexShrink: 1,
  },
  mark: {
    width: 36,
    height: 36,
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  largeMark: { width: 50, height: 50, borderRadius: radius.lg },
  invertedMark: { backgroundColor: colors.mint },
  wordmark: { letterSpacing: -0.7, flexShrink: 1 },
});
