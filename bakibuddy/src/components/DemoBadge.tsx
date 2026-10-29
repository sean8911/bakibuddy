import { StyleSheet, View } from "react-native";

import { colors, radius } from "../theme/tokens";
import { AppText } from "./AppText";

export function DemoBadge() {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <AppText variant="caption" color={colors.amber} style={styles.text}>
        DEMO DATA
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.amberSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.amber,
  },
  text: { fontWeight: "700", fontSize: 11, letterSpacing: 0.6, lineHeight: 16 },
});
