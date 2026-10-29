import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { ConfirmDelete } from "../../components/ConfirmDelete";
import { DateField } from "../../components/DateField";
import { ChoiceGroup, Field, FormError } from "../../components/FormFields";
import { FormScreen } from "../../components/FormScreen";
import { categories } from "../../constants/categories";
import { useFinance } from "../../state/FinanceProvider";
import type { PlannedItem, RepeatKind } from "../../types/budget";
import { CATEGORY_IDS, type CategoryId } from "../../types/finance";
import { colors } from "../../theme/tokens";
import { todayInKL } from "../../utils/dates";
import {
  editableAmount,
  errorMessage,
  parseAmount,
} from "../../utils/validation";

export default function PlannedItemEditor() {
  const params = useLocalSearchParams<{ id: string; kind?: string }>();
  const { snapshot, mutate, busy } = useFinance();
  const router = useRouter();
  const editing = params.id !== "new";
  const original = snapshot.budget.items.find((item) => item.id === params.id);
  const [id] = useState(randomUUID);
  const [name, setName] = useState(original?.name ?? "");
  const [kind, setKind] = useState<PlannedItem["kind"]>(
    original?.kind ?? (params.kind === "income" ? "income" : "bill"),
  );
  const [amount, setAmount] = useState(
    original ? editableAmount(original.amountSen) : "",
  );
  const [date, setDate] = useState(original?.date ?? todayInKL());
  const [repeat, setRepeat] = useState<RepeatKind>(original?.repeat ?? "once");
  const [accountId, setAccount] = useState(
    original?.accountId ?? snapshot.accounts[0]?.id ?? "",
  );
  const [category, setCategory] = useState<CategoryId>(
    original?.category ?? "bills",
  );
  const [error, setError] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const linked =
    original &&
    snapshot.budget.settlements.some((entry) => entry.itemId === original.id);
  const done = () =>
    router.canGoBack() ? router.back() : router.replace("/planned-items");
  if ((editing && !original) || !snapshot.accounts.length)
    return (
      <FormScreen
        title={editing ? "Schedule not found" : "Start with an account"}
      >
        <AppText>
          {editing
            ? "This scheduled item is no longer available."
            : "Add an account before scheduling bills or income."}
        </AppText>
        <AppButton
          label={editing ? "View bills & income" : "Add an account"}
          onPress={() =>
            router.replace(editing ? "/planned-items" : "/account/new")
          }
        />
      </FormScreen>
    );
  const save = async () => {
    try {
      await mutate((repo) =>
        repo.savePlannedItem(
          {
            id: editing ? params.id : id,
            name,
            kind,
            amountSen: parseAmount(amount),
            date,
            repeat,
            accountId,
            category,
          },
          editing,
        ),
      );
      done();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };
  return (
    <FormScreen
      title={editing ? "Edit scheduled item" : "Schedule bills or income"}
      busy={busy}
    >
      <AppText color={colors.secondary}>
        Schedules are plans. They change forecasts but never create
        transactions. Record or link each payment when it happens.
      </AppText>
      {linked && (
        <AppText color={colors.amber}>
          This item has linked records. Its financial fields are locked; unlink
          those records in Bills & income to change them.
        </AppText>
      )}
      <ChoiceGroup
        label="Scheduled type"
        value={kind}
        choices={[
          { value: "bill", label: "Bill / expense" },
          { value: "income", label: "Expected income" },
        ]}
        onChange={(value) => setKind(value as PlannedItem["kind"])}
        disabled={busy || !!linked}
      />
      <Field
        label="Schedule name"
        value={name}
        onChangeText={setName}
        placeholder={
          kind === "bill" ? "e.g. Room rent" : "e.g. Freelance payment"
        }
        maxLength={80}
        disabled={busy}
      />
      <Field
        label="Scheduled amount (RM)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        maxLength={24}
        disabled={busy || !!linked}
        hint="Use the full expected amount. Update a variable bill before linking its actual payment."
      />
      <DateField
        label="First due date"
        value={date}
        onChange={setDate}
        maximumDate="2100-12-31"
        disabled={busy || !!linked}
      />
      <ChoiceGroup
        label="Repeat"
        value={repeat}
        choices={[
          { value: "once", label: "One time" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ]}
        onChange={(value) => setRepeat(value as RepeatKind)}
        disabled={busy || !!linked}
      />
      <AppText color={colors.secondary}>
        Start a repeating schedule from the first payment you still need to
        track. Earlier unpaid occurrences remain overdue until linked or the
        schedule is removed.
      </AppText>
      <ChoiceGroup
        label={kind === "bill" ? "Payment account" : "Receiving account"}
        value={accountId}
        choices={snapshot.accounts.map((account) => ({
          value: account.id,
          label: account.name,
        }))}
        onChange={setAccount}
        disabled={busy || !!linked}
      />
      {kind === "bill" && (
        <ChoiceGroup
          label="Category"
          value={category}
          choices={CATEGORY_IDS.map((value) => ({
            value,
            label: categories[value].label,
          }))}
          onChange={(value) => setCategory(value as CategoryId)}
          disabled={busy}
        />
      )}
      <FormError message={error} />
      <AppButton
        label={busy ? "Saving…" : "Save scheduled item"}
        disabled={busy}
        onPress={() => void save()}
      />
      {editing && (
        <AppButton
          label="Delete scheduled item"
          variant="secondary"
          disabled={busy}
          onPress={() => setConfirm(true)}
        />
      )}
      <ConfirmDelete
        visible={confirm}
        title="Delete this schedule?"
        detail="All its unpaid occurrences and links will be removed. Recorded transactions stay in your ledger. This cannot be undone."
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          void (async () => {
            try {
              await mutate((repo) => repo.deletePlannedItem(params.id));
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
