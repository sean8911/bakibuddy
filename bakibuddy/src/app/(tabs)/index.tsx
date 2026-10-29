import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { BalanceCard } from "../../components/BalanceCard";
import { BudgetSummary } from "../../components/BudgetSummary";
import { FinancialCard } from "../../components/FinancialCard";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { TransactionItem } from "../../components/TransactionItem";
import { useFinance } from "../../state/FinanceProvider";
import { periodTotals } from "../../storage/ledger";
import { colors, spacing } from "../../theme/tokens";
import { longFinancialDate, todayInKL } from "../../utils/dates";
import { formatMYR } from "../../utils/money";

export default function HomeScreen() {
  const router = useRouter();
  const { snapshot } = useFinance();
  const month = periodTotals(snapshot.transactions, todayInKL().slice(0, 7));
  return (
    <Screen
      title="Your money, a little clearer."
      subtitle={longFinancialDate(todayInKL())}
    >
      <BalanceCard
        balanceSen={snapshot.totals.balanceSen}
        incomeSen={month.incomeSen}
        expenseSen={month.expenseSen}
        accountCount={snapshot.accounts.length}
      />
      {month.refundSen > 0 && (
        <View style={styles.note}>
          <AppText color={colors.secondary}>
            Refunds this month: {formatMYR(month.refundSen)}. Shown separately
            from income and expenses.
          </AppText>
        </View>
      )}
      {!snapshot.accounts.length ? (
        <View style={styles.section}>
          <FinancialCard>
            <AppText variant="title">Let’s start with your balance.</AppText>
            <AppText
              color={colors.secondary}
              style={{ marginTop: 8, marginBottom: 16 }}
            >
              Add your first account and its opening balance. Your ledger starts
              empty and stays on this device.
            </AppText>
            <AppButton
              label="Add your first account"
              icon="add-outline"
              onPress={() => router.push("/account/new")}
            />
          </FinancialCard>
        </View>
      ) : (
        <>
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton
                label="Add expense"
                icon="add-outline"
                onPress={() => router.push("/transaction/new")}
              />
            </View>
            <View style={styles.action}>
              <AppButton
                label="Add income"
                icon="arrow-down-outline"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/transaction/[id]",
                    params: { id: "new", kind: "income" },
                  })
                }
              />
            </View>
          </View>
          <View style={styles.section}>
            <SectionHeader
              title="Your accounts"
              link="/accounts"
              linkLabel="Manage"
            />
            {snapshot.accounts.slice(0, 4).map((account) => (
              <View key={account.id} style={styles.account}>
                <AppText variant="label" style={styles.flex}>
                  {account.name}
                </AppText>
                <AppText
                  variant="label"
                  money
                  color={account.balanceSen < 0 ? colors.orange : colors.navy}
                >
                  {formatMYR(account.balanceSen)}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}
      <View style={styles.section}>
        <SectionHeader title="Recent activity" link="/transactions" />
        {!snapshot.transactions.length ? (
          <AppText color={colors.secondary}>
            Your first transaction will appear here. Add an expense, income,
            refund or transfer when you’re ready.
          </AppText>
        ) : (
          snapshot.transactions
            .slice(0, 5)
            .map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                last={index === 4}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
              />
            ))
        )}
      </View>
      <View style={styles.section}>
        <BudgetSummary compact />
      </View>
      <View style={styles.actions}>
        <AppButton label="Ask about your money" icon="chatbubble-outline" variant="secondary" onPress={()=>router.push('/assistant')} />
        <AppButton label="Import TNG" icon="download-outline" variant="secondary" onPress={()=>router.push("/import-tng")} />
        <AppButton label="Scan receipt" icon="scan-outline" variant="secondary" onPress={() => router.push('/scan-receipt')} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  action: { flex: 1, minWidth: 140 },
  account: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  flex: { flex: 1, minWidth: 90 },
  note: { marginTop: 12 },
});
