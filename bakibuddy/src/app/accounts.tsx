import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { EmptyState } from "../components/EmptyState";
import { FormScreen } from "../components/FormScreen";
import { Icon } from "../components/Icon";
import { useFinance } from "../state/FinanceProvider";
import { colors, spacing } from "../theme/tokens";
import { formatMYR } from "../utils/money";
export default function AccountsScreen() {
  const router = useRouter();
  const { snapshot } = useFinance();
  return (
    <FormScreen title="Your accounts">
      <AppText color={colors.secondary}>
        Record your starting balances once. BakiBuddy then follows the
        transactions you add; it does not connect to your bank or eWallet.
      </AppText>
      {!snapshot.accounts.length && (
        <EmptyState
          icon="wallet-outline"
          title="Start where your money lives."
          description="Add a bank account, eWallet or cash balance to begin."
        />
      )}
      {snapshot.accounts.map((account) => (
        <Pressable
          key={account.id}
          accessibilityRole="button"
          accessibilityLabel={`Edit account ${account.name}, balance ${formatMYR(account.balanceSen)}`}
          onPress={() => router.push(`/account/${account.id}`)}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Icon name="wallet-outline" color={colors.emerald} />
          <View style={styles.details}>
            <AppText variant="label">{account.name}</AppText>
            <AppText variant="caption" color={colors.secondary}>
              {account.type} · Opening {formatMYR(account.openingBalanceSen)}
            </AppText>
          </View>
          <AppText variant="label" money>
            {formatMYR(account.balanceSen)}
          </AppText>
          <Icon name="chevron-forward" size={16} />
        </Pressable>
      ))}
      <AppButton
        label="Add an account"
        icon="add-outline"
        onPress={() => router.push("/account/new")}
      />
    </FormScreen>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  details: { flex: 1, minWidth: 110, gap: spacing.xs },
});
