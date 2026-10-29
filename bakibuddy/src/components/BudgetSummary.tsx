import { useRouter } from "expo-router";
import { View } from "react-native";
import { useBudget } from "../budget/useBudget";
import { colors, spacing } from "../theme/tokens";
import { formatBudgetDate as formatFinancialDate } from "../utils/dates";
import { formatMYR } from "../utils/money";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { FinancialCard } from "./FinancialCard";
import { FormError } from "./FormFields";

export function BudgetSummary({ compact = false }: { compact?: boolean }) {
  const { result, error } = useBudget();
  const router = useRouter();
  if (error)
    return (
      <View style={{ gap: 12 }}>
        <FormError message={`Your forecast needs attention: ${error}`} />
        <AppButton
          label="Edit budget plan"
          onPress={() => router.push("/budget-plan")}
        />
      </View>
    );
  if (!result)
    return (
      <FinancialCard tone="soft">
        <AppText variant="title">Make your balance last.</AppText>
        <AppText
          color={colors.secondary}
          style={{ marginTop: 8, marginBottom: 16 }}
        >
          Choose your next payday or a review date. Set aside bills and savings,
          then see an allowance based on money you already have.
        </AppText>
        <AppButton
          label="Set up your budget"
          onPress={() => router.push("/budget-plan")}
        />
      </FinancialCard>
    );
  const stopped = result.cycle.expired || result.cycle.upcoming;
  return (
    <FinancialCard
      tone="soft"
      testID="budget-summary"
      style={{ gap: spacing.md }}
    >
      <AppText variant="title">
        {stopped ? "Your plan needs a new date." : "Your daily allowance"}
      </AppText>
      {!stopped && (
        <AppText variant="heading" money testID="daily-allowance">
          {formatMYR(result.dailySen)} / day
        </AppText>
      )}
      <AppText color={colors.secondary}>
        {stopped
          ? "Update your cycle before using a daily allowance. Your recorded money has not changed."
          : `For ${result.cycle.days} day${result.cycle.days === 1 ? "" : "s"}, including today, before ${formatFinancialDate(result.cycle.end)}.`}
      </AppText>
      {!stopped && result.shortfallSen > 0 && (
        <AppText color={colors.orange}>
          Your recorded funds are {formatMYR(result.shortfallSen)} short of
          unpaid bills and your savings reserve. The allowance stays at RM0.00.
        </AppText>
      )}
      {!stopped && result.shortfallSen === 0 && result.dailySen === 0 && (
        <AppText color={colors.amber}>
          {result.availableSen > 0
            ? "Less than one sen per day is available; the remaining money is kept aside."
            : "No extra spending is available after your bills, reserve and spending cap."}
        </AppText>
      )}
      <AppText variant="caption" color={colors.secondary}>
        Expected income is excluded until recorded. This plan depends on the
        accounts and bills you enter.
      </AppText>
      {compact && (
        <AppButton
          label="Review your budget"
          variant="secondary"
          onPress={() => router.push("/budget")}
        />
      )}
    </FinancialCard>
  );
}
