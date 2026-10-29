import { useRouter } from "expo-router";
import { useState } from "react";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { DateField } from "../components/DateField";
import { ChoiceGroup, Field, FormError } from "../components/FormFields";
import { FormScreen } from "../components/FormScreen";
import { useFinance } from "../state/FinanceProvider";
import type { CycleKind } from "../types/budget";
import { todayInKL } from "../utils/dates";
import { addDays } from "../budget/calendar";
import {
  editableAmount,
  errorMessage,
  parseAmount,
  LedgerError,
} from "../utils/validation";
import { colors } from "../theme/tokens";

export default function BudgetPlanEditor() {
  const { snapshot, mutate, busy } = useFinance();
  const original = snapshot.budget.plan;
  const router = useRouter();
  const [cycle, setCycle] = useState<CycleKind>(original?.cycle ?? "weekly");
  const [startDate, setStart] = useState(original?.startDate ?? todayInKL());
  const [endDate, setEnd] = useState(
    original?.nextIncomeDate ?? addDays(todayInKL(), 7),
  );
  const [reserve, setReserve] = useState(
    editableAmount(original?.savingsReserveSen ?? 0),
  );
  const [limit, setLimit] = useState(
    original?.spendingLimitSen == null
      ? ""
      : editableAmount(original.spendingLimitSen),
  );
  const [error, setError] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const done = () =>
    router.canGoBack() ? router.back() : router.replace("/budget");
  const save = async () => {
    try {
      const savingsReserveSen = parseAmount(reserve, true);
      const spendingLimitSen = limit.trim() ? parseAmount(limit, true) : null;
      if (
        savingsReserveSen < 0 ||
        (spendingLimitSen !== null && spendingLimitSen < 0)
      )
        throw new LedgerError(
          "Savings and spending limits cannot be negative.",
        );
      await mutate((repo) =>
        repo.saveBudgetPlan({
          cycle,
          startDate,
          nextIncomeDate: endDate,
          savingsReserveSen,
          spendingLimitSen,
        }),
      );
      done();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };
  return (
    <FormScreen
      title={original ? "Edit your plan" : "Plan until payday"}
      busy={busy}
    >
      <AppText color={colors.secondary}>
        Plan across all your tracked accounts. Start with your recorded balance;
        bills and money you protect for savings come first.
      </AppText>
      <ChoiceGroup
        label="Income cycle"
        choices={[
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "custom", label: "Custom dates" },
          { value: "irregular", label: "Irregular income" },
        ]}
        value={cycle}
        onChange={(value) => setCycle(value as CycleKind)}
        disabled={busy}
      />
      <DateField
        label="First cycle starts"
        value={startDate}
        onChange={setStart}
        disabled={busy}
      />
      <DateField
        label={
          cycle === "irregular" ? "Review date" : "Next income date / cycle end"
        }
        value={endDate}
        onChange={setEnd}
        maximumDate="2100-12-31"
        disabled={busy}
      />
      <AppText color={colors.secondary}>
        {cycle === "weekly" || cycle === "monthly"
          ? "This payday anchors a repeating cycle, even after it passes. Monthly dates use the last valid day in shorter months, then return to the original day. No income is created automatically."
          : "This plan ends on your chosen date and will need a new date. If income is uncertain, use a review date; the allowance relies only on money already recorded."}
      </AppText>
      <Field
        label="Savings reserve (RM)"
        value={reserve}
        onChangeText={setReserve}
        keyboardType="decimal-pad"
        maxLength={24}
        disabled={busy}
        hint="Money already in your accounts to keep untouched. This does not move or add money. Use 0 for no reserve."
      />
      <Field
        label="Cycle spending limit (RM, optional)"
        value={limit}
        onChangeText={setLimit}
        keyboardType="decimal-pad"
        maxLength={24}
        disabled={busy}
        hint="Includes recorded expenses and unpaid bills. Leave blank for no cap; 0 permits no extra spending. Refunds do not reset this cap."
      />
      <FormError message={error} />
      <AppButton
        label={busy ? "Saving…" : "Save budget plan"}
        onPress={() => void save()}
        disabled={busy}
      />
      {original && (
        <AppButton
          label="Remove budget plan"
          variant="secondary"
          disabled={busy}
          onPress={() => setConfirm(true)}
        />
      )}
      <ConfirmDelete
        visible={confirm}
        title="Remove this budget plan?"
        detail="Your accounts, transactions and scheduled bills/income stay saved. Daily allowances will stop until you create another plan."
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          void (async () => {
            try {
              await mutate((repo) => repo.deleteBudgetPlan());
              done();
            } catch (failure) {
              setConfirm(false);
              setError(errorMessage(failure));
            }
          })()
        }
      />
    </FormScreen>
  );
}
