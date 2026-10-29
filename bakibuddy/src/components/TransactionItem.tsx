import { Pressable, StyleSheet, View } from "react-native";

import { categories } from "../constants/categories";
import { colors, spacing } from "../theme/tokens";
import type { TransactionDisplay } from "../types/finance";
import { formatMYR } from "../utils/money";
import { AppText } from "./AppText";
import { CategoryIcon } from "./CategoryIcon";

export function TransactionItem({
  transaction,
  last = false,
  onPress,
}: {
  transaction: TransactionDisplay;
  last?: boolean;
  onPress?: () => void;
}) {
  const { merchant, kind, category, amountSen, account } = transaction;
  const incoming = kind === "income" || kind === "refund";
  const sign = incoming ? "+" : kind === "expense" ? "−" : "";
  const directionLabel =
    kind === "expense"
      ? "expense, money out"
      : incoming
        ? `${kind}, money in`
        : "transfer, between tracked accounts, not income or spending";
  const typeLabel =
    kind === "transfer"
      ? "Transfer"
      : kind === "income"
        ? "Income"
        : kind === "refund"
          ? "Refund"
          : categories[category].label;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !last && styles.separator,
        pressed && { opacity: 0.7 },
      ]}
      accessible
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      accessibilityHint={
        onPress ? "Opens the transaction to edit or delete it" : undefined
      }
      accessibilityLabel={`${merchant}, ${directionLabel}, ${formatMYR(amountSen)}, ${typeLabel}, ${account}`}
    >
      <CategoryIcon category={category} kind={kind} />
      <View style={styles.details}>
        <AppText variant="label">{merchant}</AppText>
        <AppText variant="caption" color={colors.secondary}>
          {typeLabel} · {account}
        </AppText>
        {kind === "transfer" && (
          <AppText variant="caption" color={colors.secondary}>
            Between accounts · not spending
          </AppText>
        )}
      </View>
      <AppText
        variant="label"
        money
        color={
          incoming
            ? colors.emerald
            : kind === "transfer"
              ? colors.secondary
              : colors.navy
        }
        style={styles.amount}
      >
        {sign}
        {formatMYR(amountSen)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  separator: { borderBottomWidth: 1, borderBottomColor: colors.line },
  details: { flex: 1, minWidth: 105, gap: 3 },
  amount: { marginLeft: "auto", flexShrink: 1 },
});
