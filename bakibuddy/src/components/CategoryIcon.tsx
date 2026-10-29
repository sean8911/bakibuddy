import { StyleSheet, View } from "react-native";

import { categories } from "../constants/categories";
import { colors, radius } from "../theme/tokens";
import type { CategoryId, TransactionKind } from "../types/finance";
import { Icon, type IconName } from "./Icon";

export function CategoryIcon({
  category,
  kind,
  small = false,
}: {
  category: CategoryId;
  kind?: TransactionKind;
  small?: boolean;
}) {
  const config = categories[category];
  const special = kind === "income" || kind === "refund";
  const icon: IconName =
    kind === "transfer"
      ? "swap-horizontal-outline"
      : special
        ? "arrow-down-outline"
        : config.icon;
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: special ? colors.emeraldSoft : config.background },
        small && styles.small,
      ]}
    >
      <Icon
        name={icon}
        color={special ? colors.emerald : config.color}
        size={small ? 19 : 22}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  small: { width: 38, height: 38, borderRadius: radius.sm },
});
