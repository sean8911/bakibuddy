import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, layout, radius, spacing } from "../theme/tokens";
import { formatMYR } from "../utils/money";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

export function BalanceCard({
  balanceSen,
  incomeSen,
  expenseSen,
  accountCount,
}: {
  balanceSen: number;
  incomeSen: number;
  expenseSen: number;
  accountCount: number;
}) {
  const [hidden, setHidden] = useState(false);
  return (
    <View style={styles.card} testID="balance-card">
      <View style={styles.top}>
        <View style={styles.balanceLabel}>
          <AppText color={colors.onEmerald}>Recorded balance</AppText>
          <AppText variant="caption" color={colors.onEmerald}>
            {accountCount} local {accountCount === 1 ? "account" : "accounts"}
          </AppText>
        </View>
        <Pressable
          onPress={() => setHidden((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Show balance" : "Hide balance"}
          accessibilityState={{ expanded: !hidden }}
          aria-expanded={!hidden}
          hitSlop={4}
          style={({ pressed }) => [styles.eye, pressed && { opacity: 0.6 }]}
        >
          <Icon
            name={hidden ? "eye-off-outline" : "eye-outline"}
            color={colors.onEmerald}
            size={23}
          />
        </Pressable>
      </View>
      <AppText
        variant="display"
        money
        color={colors.surface}
        style={styles.amount}
        testID="balance-amount"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {hidden ? "••••••" : formatMYR(balanceSen)}
      </AppText>
      <View style={styles.accountRow}>
        <Icon name="shield-checkmark-outline" color={colors.mint} size={14} />
        <AppText variant="caption" color={colors.onEmerald}>
          Based on the records you add.
        </AppText>
      </View>
      {accountCount > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.bottom}>
            <View style={styles.stat}>
              <View style={styles.statLabel}>
                <Icon name="arrow-down-outline" color={colors.mint} size={15} />
                <AppText variant="caption" color={colors.onEmerald}>
                  Income this month
                </AppText>
              </View>
              <AppText variant="title" money color={colors.surface}>
                {hidden ? "••••" : formatMYR(incomeSen)}
              </AppText>
            </View>
            <View style={styles.stat}>
              <View style={styles.statLabel}>
                <Icon
                  name="arrow-up-outline"
                  color={colors.onEmerald}
                  size={15}
                />
                <AppText variant="caption" color={colors.onEmerald}>
                  Expenses this month
                </AppText>
              </View>
              <AppText variant="title" money color={colors.surface}>
                {hidden ? "••••" : formatMYR(expenseSen)}
              </AppText>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.emerald,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  balanceLabel: { flex: 1, gap: 2 },
  eye: {
    minHeight: layout.targetSize,
    minWidth: layout.targetSize,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  amount: { marginTop: spacing.md, flexShrink: 1, fontSize: 40 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: "#3F806C",
    marginVertical: spacing.xl,
  },
  bottom: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xl },
  stat: { flexGrow: 1, gap: spacing.xs },
  statLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
});
