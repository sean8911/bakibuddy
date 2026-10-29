import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  calculateAnalytics,
  presetRange,
  shareText,
  validateRange,
  type DateRange,
  type RangePreset,
} from "../analytics/engine";
import { categories } from "../constants/categories";
import { useFinance } from "../state/FinanceProvider";
import { colors, spacing } from "../theme/tokens";
import { formatBudgetDate } from "../utils/dates";
import { formatMYR } from "../utils/money";
import { errorMessage } from "../utils/validation";
import { MoneyBarChart, SpendingTimeline } from "./AnalyticsCharts";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { BudgetUtilization } from "./BudgetUtilization";
import { DateField } from "./DateField";
import { EmptyState } from "./EmptyState";
import { FinancialCard } from "./FinancialCard";
import { ChoiceGroup, FormError } from "./FormFields";
import { ProgressIndicator } from "./ProgressIndicator";
import { Screen } from "./Screen";

function MoneyRow({
  label,
  value,
  testID,
  color = colors.navy,
}: {
  label: string;
  value: number;
  testID?: string;
  color?: string;
}) {
  return (
    <View style={styles.row}>
      <AppText color={colors.secondary} style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="label" money color={color} testID={testID}>
        {formatMYR(value)}
      </AppText>
    </View>
  );
}
export function InsightsDashboard() {
  const { snapshot, today } = useFinance();
  const router = useRouter();
  const [preset, setPreset] = useState<RangePreset>("month");
  const [customRange, setCustomRange] = useState<DateRange>(() =>
    presetRange("month", today),
  );
  const [draftStart, setDraftStart] = useState(customRange.start);
  const [draftEnd, setDraftEnd] = useState(customRange.end);
  const [rangeError, setRangeError] = useState<string>();
  const [selectedAccount, setAccount] = useState("all");
  const accountId = snapshot.accounts.some(
    (account) => account.id === selectedAccount,
  )
    ? selectedAccount
    : "all";
  const range = preset === "custom" ? customRange : presetRange(preset, today);
  const { data, error } = useMemo(() => {
    try {
      return {
        data: calculateAnalytics(
          snapshot,
          { start: range.start, end: range.end },
          today,
          accountId,
        ),
        error: undefined,
      };
    } catch (failure) {
      return { data: undefined, error: errorMessage(failure) };
    }
  }, [snapshot, range.start, range.end, today, accountId]);
  const choosePreset = (value: string) => {
    if (value === "custom") {
      setDraftStart(range.start);
      setDraftEnd(range.end);
    }
    setRangeError(undefined);
    setPreset(value as RangePreset);
  };
  const reset = () => {
    setPreset("month");
    setAccount("all");
    setRangeError(undefined);
  };
  const apply = () => {
    try {
      const next = validateRange({ start: draftStart, end: draftEnd }, today);
      setCustomRange(next);
      setRangeError(undefined);
    } catch (failure) {
      setRangeError(errorMessage(failure));
    }
  };
  return (
    <Screen
      title="Small habits. Bigger picture."
      subtitle="Your recorded money, seen over time."
    >
      <View style={styles.controls}>
        <ChoiceGroup
          label="Insights period"
          choices={[
            { value: "month", label: "This month" },
            { value: "seven", label: "Last 7 days" },
            { value: "thirty", label: "Last 30 days" },
            { value: "custom", label: "Custom dates" },
          ]}
          value={preset}
          onChange={choosePreset}
        />
        {preset === "custom" && (
          <View style={styles.controls}>
            <DateField
              label="Insights start date"
              value={draftStart}
              onChange={setDraftStart}
            />
            <DateField
              label="Insights end date"
              value={draftEnd}
              onChange={setDraftEnd}
            />
            <AppText variant="caption" color={colors.secondary}>
              Include both dates, up to 366 days. Invalid changes keep the last
              applied range below.
            </AppText>
            <FormError message={rangeError} />
            <AppButton label="Apply date range" onPress={apply} />
          </View>
        )}
        <ChoiceGroup
          label="Insights account"
          choices={[
            { value: "all", label: "All accounts" },
            ...snapshot.accounts.map((account) => ({
              value: account.id,
              label: account.name,
            })),
          ]}
          value={accountId}
          onChange={setAccount}
        />
        <AppText variant="label" color={colors.emerald} testID="insights-range">
          {formatBudgetDate(range.start)} – {formatBudgetDate(range.end)}
        </AppText>
      </View>
      {error && (
        <View style={styles.section}>
          <FormError
            message={`These records could not be summarized: ${error} Try a shorter date range.`}
          />
          <AppButton
            label="Reset Insights filters"
            variant="secondary"
            onPress={reset}
          />
        </View>
      )}
      {data && data.current.count === 0 && (
        <FinancialCard style={styles.section}>
          <EmptyState
            title="No records in this period."
            description={
              snapshot.transactions.length
                ? "Try another date range or account to explore your saved records. No chart values have been invented."
                : "Your charts will grow from transactions you record. Start with an account, then add income or an expense."
            }
          />
          <AppButton
            label={
              snapshot.accounts.length
                ? "Add transaction"
                : "Add your first account"
            }
            onPress={() =>
              router.push(
                snapshot.accounts.length ? "/transaction/new" : "/account/new",
              )
            }
          />
          {snapshot.transactions.length > 0 && (
            <AppButton
              label="Reset Insights filters"
              variant="secondary"
              onPress={reset}
            />
          )}
        </FinancialCard>
      )}
      {data && data.current.count > 0 && (
        <>
          <View style={styles.section}>
            <AppText variant="title">Recorded cash flow</AppText>
            <AppText color={colors.secondary}>
              {data.current.count} record{data.current.count === 1 ? "" : "s"}{" "}
              in this range. {data.current.transferCount} transfer
              {data.current.transferCount === 1 ? "" : "s"} excluded from income
              and spending.
            </AppText>
            <MoneyRow
              label="Income"
              value={data.current.incomeSen}
              testID="analytics-income"
              color={colors.emerald}
            />
            <MoneyRow
              label="Expenses"
              value={data.current.expenseSen}
              testID="analytics-expenses"
            />
            <MoneyRow
              label="Refunds"
              value={data.current.refundSen}
              testID="analytics-refunds"
              color={colors.emerald}
            />
            <MoneyRow
              label="Net recorded flow"
              value={data.current.netFlowSen}
              testID="analytics-net"
              color={
                data.current.netFlowSen < 0 ? colors.orange : colors.emerald
              }
            />
            <AppText variant="caption" color={colors.secondary}>
              Net flow = income + refunds − expenses. Opening balances, internal
              transfers, bills still planned and expected income are excluded.
              This is a period flow, not your account balance.
            </AppText>
          </View>
          {data.current.expenseSen > 0 ? (
            <SpendingTimeline
              key={`${range.start}/${range.end}/${accountId}`}
              buckets={data.buckets}
            />
          ) : (
            <View style={styles.section}>
              <AppText variant="title">No expenses recorded here.</AppText>
              <AppText color={colors.secondary}>
                There is no spending chart or category split for this selection.
                Income, refunds and transfers remain distinct; unrecorded
                activity is unknown.
              </AppText>
            </View>
          )}
          <View style={styles.section}>
            <AppText variant="title">Where recorded spending went</AppText>
            {data.categories.length ? (
              <>
                <AppText color={colors.secondary}>
                  Gross expenses by category. Refunds stay separate. Rounded
                  shares add to 100.00%.
                </AppText>
                <View testID="category-breakdown">
                  {data.categories.map((item) => (
                    <View key={item.category} style={styles.category}>
                      <View style={styles.row}>
                        <AppText variant="label" style={styles.rowLabel}>
                          {categories[item.category].label}
                        </AppText>
                        <AppText variant="label" money>
                          {formatMYR(item.amountSen)}
                        </AppText>
                      </View>
                      <ProgressIndicator
                        value={item.shareBasisPoints / 100}
                        label={`${categories[item.category].label}: ${formatMYR(item.amountSen)}, ${shareText(item.shareBasisPoints)} of recorded expenses`}
                        color={categories[item.category].color}
                      />
                      <AppText variant="caption" color={colors.secondary}>
                        {shareText(item.shareBasisPoints)} · {item.count}{" "}
                        expense{item.count === 1 ? "" : "s"}
                      </AppText>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <AppText color={colors.secondary}>
                No expense categories to compare in this range.
              </AppText>
            )}
          </View>
          <View style={styles.section}>
            <AppText variant="title">Income and expenses, side by side</AppText>
            {[
              data.current.incomeSen,
              data.current.expenseSen,
              data.current.refundSen,
            ].some((value) => value > 0) && (
              <MoneyBarChart
                points={[
                  {
                    label: "Income",
                    value: data.current.incomeSen,
                    color: colors.emerald,
                  },
                  {
                    label: "Expenses",
                    value: data.current.expenseSen,
                    color: colors.navy,
                  },
                  {
                    label: "Refunds",
                    value: data.current.refundSen,
                    color: colors.emerald,
                  },
                ]}
                label={`Income ${formatMYR(data.current.incomeSen)}, expenses ${formatMYR(data.current.expenseSen)}, refunds ${formatMYR(data.current.refundSen)}. Exact values are listed in Recorded cash flow.`}
                testID="cash-flow-chart"
              />
            )}
            <AppText variant="caption" color={colors.secondary}>
              Labels identify each bar. Refunds are money returned, separate
              from new income.
            </AppText>
          </View>
          <View style={styles.section} testID="analytics-trend">
            <AppText variant="title">What your records show</AppText>
            <MoneyRow
              label={`Average expense per calendar day (${data.days} days)`}
              value={data.dailyAverageSen}
            />
            <AppText variant="caption" color={colors.secondary}>
              Average rounds down to whole sen and includes all days in the
              selected range, including days without recorded expenses.
            </AppText>
            {data.categories[0] && (
              <AppText>
                Largest recorded expense category:{" "}
                {categories[data.categories[0].category].label},{" "}
                {formatMYR(data.categories[0].amountSen)}.
              </AppText>
            )}
            <AppText color={colors.secondary}>
              Previous {data.days}-day comparison:{" "}
              {formatBudgetDate(data.previousRange.start)} –{" "}
              {formatBudgetDate(data.previousRange.end)}. Same account
              selection.
            </AppText>
            <MoneyRow
              label="Previous recorded expenses"
              value={data.previous.expenseSen}
            />
            {data.trendState === "comparable" ? (
              <AppText testID="spending-comparison">
                {data.differenceSen === 0
                  ? "Recorded expenses match the previous period."
                  : `Recorded expenses are ${formatMYR(Math.abs(data.differenceSen))} ${data.differenceSen > 0 ? "higher" : "lower"} than the previous period. Change: ${data.changePercent}.`}
              </AppText>
            ) : (
              <AppText color={colors.secondary}>
                {data.trendState === "no-baseline"
                  ? "No expenses are recorded in the previous comparison period. A percentage change is unavailable from zero."
                  : "There are no recorded expenses in the current range to describe a spending trend."}
              </AppText>
            )}
            <AppText variant="caption" color={colors.secondary}>
              These summaries describe saved entries. Missing records are not
              proof of no spending, and partial histories can change
              comparisons.
            </AppText>
          </View>
        </>
      )}
      <BudgetUtilization />
      <View style={styles.section}>
        <AppButton
          label="Explore transactions"
          variant="secondary"
          onPress={() => router.push("/transactions")}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  controls: { gap: spacing.lg },
  section: { marginTop: spacing.xl, gap: spacing.md },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: { flex: 1, minWidth: 120 },
  category: { paddingVertical: 12, gap: 8 },
});
