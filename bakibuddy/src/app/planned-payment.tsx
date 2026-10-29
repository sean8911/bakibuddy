import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { isOccurrence } from "../budget/calendar";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { ChoiceGroup, FormError } from "../components/FormFields";
import { FormScreen } from "../components/FormScreen";
import { useFinance } from "../state/FinanceProvider";
import { colors } from "../theme/tokens";
import { formatBudgetDate as formatFinancialDate } from "../utils/dates";
import { formatMYR } from "../utils/money";
import { errorMessage } from "../utils/validation";

export default function PlannedPaymentScreen() {
  const { itemId, dueDate } = useLocalSearchParams<{
    itemId: string;
    dueDate: string;
  }>();
  const { snapshot, mutate, busy } = useFinance();
  const router = useRouter();
  const item = snapshot.budget.items.find((entry) => entry.id === itemId);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  let valid = false;
  try {
    valid = !!item && isOccurrence(item, dueDate);
  } catch {
    /* Invalid deep link. */
  }
  if (!valid || !item)
    return (
      <FormScreen title="Payment not found">
        <AppText>This scheduled occurrence is no longer available.</AppText>
        <AppButton
          label="View bills & income"
          onPress={() => router.replace("/planned-items")}
        />
      </FormScreen>
    );
  const link = snapshot.budget.settlements.find(
    (entry) => entry.itemId === itemId && entry.dueDate === dueDate,
  );
  const candidates = snapshot.transactions.filter(
    (entry) =>
      entry.kind === (item.kind === "bill" ? "expense" : "income") &&
      entry.amountSen === item.amountSen &&
      entry.accountId === item.accountId &&
      !snapshot.budget.settlements.some(
        (settled) => settled.transactionId === entry.id,
      ),
  );
  return (
    <FormScreen title={item.name} busy={busy}>
      <AppText variant="heading" money>
        {formatMYR(item.amountSen)}
      </AppText>
      <AppText color={colors.secondary}>
        {item.kind === "bill" ? "Bill" : "Expected income"} due{" "}
        {formatFinancialDate(dueDate)} ·{" "}
        {
          snapshot.accounts.find((account) => account.id === item.accountId)
            ?.name
        }
      </AppText>
      {link ? (
        <>
          <AppText>
            This occurrence is linked to a real transaction. It is no longer
            counted as an unpaid bill or expected income.
          </AppText>
          <AppButton
            label="View recorded transaction"
            onPress={() => router.push(`/transaction/${link.transactionId}`)}
          />
          <AppButton
            label="Unlink this payment"
            variant="secondary"
            disabled={busy}
            onPress={() => setConfirm(true)}
          />
        </>
      ) : (
        <>
          <AppText color={colors.secondary}>
            Already recorded it? Link the matching transaction below to avoid
            counting it twice. Otherwise, record it only after money has moved.
            The type, full amount and account must match.
          </AppText>
          <AppButton
            label={
              item.kind === "bill"
                ? "Record payment now"
                : "Record received income"
            }
            onPress={() =>
              router.push({
                pathname: "/transaction/[id]",
                params: { id: "new", plannedId: item.id, dueDate },
              })
            }
            disabled={busy}
          />
          {candidates.length > 0 ? (
            <>
              <ChoiceGroup
                label="Existing matching transaction"
                choices={candidates.map((entry) => ({
                  value: entry.id,
                  label: `${entry.merchant} · ${formatFinancialDate(entry.date)} · ${formatMYR(entry.amountSen)}`,
                }))}
                value={selected}
                onChange={setSelected}
                disabled={busy}
              />
              <AppButton
                label="Link selected transaction"
                variant="secondary"
                disabled={busy || !selected}
                onPress={() =>
                  void (async () => {
                    try {
                      await mutate((repo) =>
                        repo.linkPlannedRecord({
                          itemId,
                          dueDate,
                          transactionId: selected,
                        }),
                      );
                    } catch (failure) {
                      setError(errorMessage(failure));
                    }
                  })()
                }
              />
            </>
          ) : (
            <AppText color={colors.secondary}>
              No unlinked transaction matches this amount and account yet.
            </AppText>
          )}
        </>
      )}
      <FormError message={error} />
      <ConfirmDelete
        visible={confirm}
        title="Remove this payment link?"
        detail="The recorded transaction stays in your ledger. This occurrence becomes pending again, so its money will be reserved or forecast again."
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          void (async () => {
            try {
              await mutate((repo) => repo.unlinkPlannedRecord(itemId, dueDate));
              setConfirm(false);
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
