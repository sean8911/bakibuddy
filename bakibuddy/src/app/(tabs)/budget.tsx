import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useBudget } from "../../budget/useBudget";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { BudgetSummary } from "../../components/BudgetSummary";
import { FinancialCard } from "../../components/FinancialCard";
import { Screen } from "../../components/Screen";
import { useFinance } from "../../state/FinanceProvider";
import { colors, spacing } from "../../theme/tokens";
import { formatBudgetDate as formatFinancialDate } from "../../utils/dates";
import { formatMYR } from "../../utils/money";
export default function BudgetScreen() {
  const router = useRouter();
  const { snapshot } = useFinance();
  const { result } = useBudget();
  return (
    <Screen
      title="Make room for a plan."
      subtitle="Bills first. Savings protected. Your day, clearer."
    >
      <BudgetSummary />
      {result && !result.cycle.expired && !result.cycle.upcoming && (
        <>
          <View style={styles.section}>
            <AppText variant="title">How your allowance adds up</AppText>
            <AppText color={colors.secondary}>
              All tracked accounts · {formatFinancialDate(result.cycle.start)}{" "}
              to {formatFinancialDate(result.cycle.end)}. The end date starts
              the next cycle.
            </AppText>
            <AmountRow
              label="Recorded balance"
              amount={result.recordedBalanceSen}
            />
            <AmountRow
              label="Unpaid bills before cycle end"
              amount={result.billsSen}
            />
            <AmountRow
              label="Savings reserve"
              amount={result.savingsReserveSen}
            />
            {result.remainingLimitSen !== null && (
              <>
                <AmountRow
                  label="Expenses recorded this cycle"
                  amount={result.spentSen}
                />
                <AmountRow
                  label="Spending cap left after expenses & bills"
                  amount={result.remainingLimitSen}
                />
              </>
            )}
            <AmountRow
              label="Available for extra spending"
              amount={result.availableSen}
              positive
            />
            <AppText variant="caption" color={colors.secondary}>
              The available amount is the smaller of your funds after
              bills/savings and any remaining spending cap. Daily amounts round
              down to whole sen; {formatMYR(result.roundingRemainderSen)} stays
              unallocated. Transfers are excluded from spending, and refunds do
              not reset the cap.
            </AppText>
          </View>
          <View style={styles.section}>
            <AppText variant="title">Before your cycle ends</AppText>
            <FinancialCard style={{ gap: 12 }}>
              <AmountRow
                label="Expected income before the end date"
                amount={result.expectedIncomeSen}
              />
              <AmountRow
                label="Forecast before extra spending"
                amount={result.forecastBalanceSen}
              />
              <AmountRow
                label="Forecast if you use the full allowance"
                amount={result.forecastAfterAllowanceSen}
              />
              <AppText variant="caption" color={colors.secondary}>
                Forecast = recorded balance − unpaid bills + pending expected
                income. It assumes those payments happen. Savings stay in the
                balance. Income and bills due on the end date belong to the next
                cycle.
              </AppText>
            </FinancialCard>
            {result.cashflowShortfallSen > 0 && (
              <AppText color={colors.orange}>
                Payment timing could leave you{" "}
                {formatMYR(result.cashflowShortfallSen)} below zero before
                expected income arrives. Bills are considered before income on
                the same day.
              </AppText>
            )}
            {result.overdueIncome.length > 0 && (
              <AppText color={colors.amber}>
                {result.overdueIncome.length} overdue expected income item(s)
                are excluded from the forecast. Record received income or update
                its schedule.
              </AppText>
            )}
            {result.accountShortfalls.map((entry) => (
              <AppText key={entry.accountId} color={colors.amber}>
                {
                  snapshot.accounts.find(
                    (account) => account.id === entry.accountId,
                  )?.name
                }
                : scheduled payments could exceed this account’s funds by{" "}
                {formatMYR(entry.amountSen)}. Review payment timing or transfer
                funds.
              </AppText>
            ))}
          </View>
          <View style={styles.section}>
            <AppText variant="title">Bills to keep in view</AppText>
            {!result.bills.length ? (
              <AppText color={colors.secondary}>
                No unpaid bills before this cycle ends. Add the bills you need
                to protect money for.
              </AppText>
            ) : (
              result.bills.slice(0, 3).map((bill) => (
                <View key={`${bill.id}/${bill.dueDate}`} style={styles.bill}>
                  <AppText variant="label">
                    {bill.name} · {formatMYR(bill.amountSen)}
                  </AppText>
                  <AppText color={colors.secondary}>
                    Due {formatFinancialDate(bill.dueDate)} ·{" "}
                    {
                      snapshot.accounts.find(
                        (account) => account.id === bill.accountId,
                      )?.name
                    }
                  </AppText>
                  <AppButton
                    label={`Review ${bill.name}`}
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: "/planned-payment",
                        params: { itemId: bill.id, dueDate: bill.dueDate },
                      })
                    }
                  />
                </View>
              ))
            )}
          </View>
        </>
      )}
      <View style={styles.section}>
        {snapshot.budget.plan && (
          <AppButton
            label="Edit budget plan"
            onPress={() => router.push("/budget-plan")}
          />
        )}
        <AppButton
          label="Bills & income"
          variant="secondary"
          onPress={() => router.push("/planned-items")}
        />
        <AppButton
          label="Manage accounts"
          variant="secondary"
          onPress={() => router.push("/accounts")}
        />
      </View>
    </Screen>
  );
}
function AmountRow({
  label,
  amount,
  positive = false,
}: {
  label: string;
  amount: number;
  positive?: boolean;
}) {
  return (
    <View style={styles.row}>
      <AppText color={colors.secondary} style={styles.label}>
        {label}
      </AppText>
      <AppText
        variant="label"
        money
        color={positive ? colors.emerald : colors.navy}
      >
        {formatMYR(amount)}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: spacing.xl, gap: spacing.md },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  label: { flex: 1, minWidth: 120 },
  bill: {
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});
