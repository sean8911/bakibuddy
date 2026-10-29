import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { colors, radius } from "../theme/tokens";
export function LocalBadge() {
  return (
    <View style={styles.badge}>
      <AppText variant="caption" color={colors.emerald} style={styles.text}>
        ON THIS DEVICE
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.emeraldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: { fontWeight: "700", fontSize: 11, lineHeight: 16, letterSpacing: 0.3 },
});
