import { useRouter } from "expo-router";
import { View } from "react-native";
import { budgetUtilization } from "../analytics/engine";
import { useFinance } from "../state/FinanceProvider";
import { colors } from "../theme/tokens";
import { formatBudgetDate } from "../utils/dates";
import { formatMYR } from "../utils/money";
import { errorMessage } from "../utils/validation";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { FormError } from "./FormFields";
import { ProgressIndicator } from "./ProgressIndicator";

export function BudgetUtilization() {
  const { snapshot, today } = useFinance();
  const router = useRouter();
  let usage: ReturnType<typeof budgetUtilization> | undefined,
    error: string | undefined;
  try {
    usage = budgetUtilization(snapshot, today);
  } catch (failure) {
    error = errorMessage(failure);
  }
  return (
    <View style={{ marginTop: 24, gap: 12 }} testID="budget-utilization">
      <AppText variant="title">Current budget usage</AppText>
      <AppText color={colors.secondary}>
        All accounts · current cycle. This section stays separate from the date
        and account filters above.
      </AppText>
      <FormError message={error} />
      {usage?.state === "active" ? (
        <>
          <AppText color={colors.secondary}>
            {formatBudgetDate(usage.start)} – before{" "}
            {formatBudgetDate(usage.end)}
          </AppText>
          <AppText variant="title" money testID="budget-used">
            {formatMYR(usage.usedSen)} of {formatMYR(usage.capSen)}
          </AppText>
          <ProgressIndicator
            value={usage.progress}
            label={`Current cycle spending cap: ${formatMYR(usage.usedSen)} recorded or committed out of ${formatMYR(usage.capSen)}`}
            color={usage.overSen > 0 ? colors.orange : colors.emerald}
          />
          <AppText color={usage.overSen > 0 ? colors.orange : colors.secondary}>
            {usage.capSen === 0
              ? `Zero spending cap.${usage.usedSen > 0 ? ` Recorded expenses and bills exceed it by ${formatMYR(usage.overSen)}.` : " No extra spending is allowed by this cap."}`
              : `${usage.percentText} used or committed. ${usage.overSen > 0 ? `${formatMYR(usage.overSen)} above the cap.` : `${formatMYR(usage.remainingSen)} left in the cap.`}`}
          </AppText>
          <AppText variant="caption" color={colors.secondary}>
            Recorded expenses: {formatMYR(usage.recordedSen)}. Unpaid bills:{" "}
            {formatMYR(usage.pendingBillsSen)}. Refunds do not reset the cap. A
            paid, linked bill replaces its commitment without being counted
            twice.
          </AppText>
        </>
      ) : (
        <AppText color={colors.secondary}>
          {usage?.state === "no-cap"
            ? "Your plan has no spending cap. Add an optional limit to track its usage here."
            : usage?.state === "inactive"
              ? "Update your plan’s dates before reviewing current-cycle usage."
              : "Set up a budget plan and optional spending cap to see current-cycle usage."}
        </AppText>
      )}
      <AppButton
        label={
          usage?.state === "active" ? "Review budget" : "Set budget limits"
        }
        variant="secondary"
        onPress={() =>
          router.push(usage?.state === "active" ? "/budget" : "/budget-plan")
        }
      />
    </View>
  );
}
