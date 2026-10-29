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
import {
  CATEGORY_IDS,
  type CategoryId,
  type TransactionKind,
} from "../../types/finance";
import { todayInKL } from "../../utils/dates";
import {
  editableAmount,
  errorMessage,
  LedgerError,
  parseAmount,
} from "../../utils/validation";
import { colors } from "../../theme/tokens";

const kindOptions = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "refund", label: "Refund" },
  { value: "transfer", label: "Transfer" },
];
export default function TransactionEditor() {
  const params = useLocalSearchParams<{ id: string; kind?: string; plannedId?: string; dueDate?: string }>();
  const editing = params.id !== "new";
  const router = useRouter();
  const { snapshot, mutate, busy } = useFinance();
  const planned = !editing ? snapshot.budget.items.find((item) => item.id === params.plannedId) : undefined;
  const linked = snapshot.budget.settlements.some((entry) => entry.transactionId === params.id);
  const original = snapshot.transactions.find(
    (record) => record.id === params.id,
  );
  const [newId] = useState(randomUUID);
  const [kind, setKind] = useState<TransactionKind>(
    original?.kind ?? (planned ? planned.kind === "bill" ? "expense" : "income" : undefined) ??
      (kindOptions.some((option) => option.value === params.kind)
        ? (params.kind as TransactionKind)
        : "expense"),
  );
  const [merchant, setMerchant] = useState(original?.merchant ?? planned?.name ?? "");
  const [amount, setAmount] = useState(
    original ? editableAmount(original.amountSen) : planned ? editableAmount(planned.amountSen) : "",
  );
  const [accountId, setAccountId] = useState(
    original?.accountId ?? planned?.accountId ?? snapshot.accounts[0]?.id ?? "",
  );
  const [target, setTarget] = useState(original?.transferToAccountId ?? "");
  const [category, setCategory] = useState<CategoryId>(
    original?.category ?? planned?.category ?? "food",
  );
  const [date, setDate] = useState(original?.date ?? todayInKL());
  const [description, setDescription] = useState(original?.description ?? "");
  const [error, setError] = useState<string>();
  const [amountError, setAmountError] = useState<string>();
  const [duplicate, setDuplicate] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/transactions");
  const changed = () => {
    setError(undefined);
    setDuplicate(false);
  };
  if (editing && !original)
    return (
      <FormScreen title="Transaction not found">
        <AppText>This transaction is no longer available.</AppText>
        <AppButton
          label="View transactions"
          onPress={() => router.replace("/transactions")}
        />
      </FormScreen>
    );
  if (!snapshot.accounts.length)
    return (
      <FormScreen title="Start with an account">
        <AppText>
          Add an account and opening balance before recording a transaction.
        </AppText>
        <AppButton
          label="Add an account"
          onPress={() => router.replace("/account/new")}
        />
      </FormScreen>
    );
  const save = async (allowDuplicate = false) => {
    setError(undefined);
    try {
      const input = {
        id: editing ? params.id : newId,
        merchant,
        kind,
        category,
        amountSen: parseAmount(amount),
        date,
        accountId,
        transferToAccountId: kind === "transfer" ? target : null,
        description,
      };
      await mutate((repository) =>
        repository.saveTransaction(input, editing, allowDuplicate, params.plannedId && params.dueDate ? { itemId: params.plannedId, dueDate: params.dueDate } : undefined),
      );
      back();
    } catch (failure) {
      setError(errorMessage(failure));
      setDuplicate(
        failure instanceof LedgerError && failure.code === "DUPLICATE",
      );
    }
  };
  return (
    <FormScreen
      title={editing ? "Edit transaction" : "New transaction"}
      busy={busy}
    >
      {(planned || linked) && <AppText color={colors.secondary}>{planned ? "Saving records the actual payment and links it to this scheduled occurrence in one step. Confirm the date money moved; it defaults to today." : "This record is linked to a scheduled payment. Unlink it in Bills & income before changing its type, amount or account. Deleting it makes that occurrence pending again."}</AppText>}
      <ChoiceGroup
        label="Transaction type"
        choices={kindOptions}
        value={kind}
        onChange={(value) => {
          setKind(value as TransactionKind);
          changed();
        }}
        disabled={busy}
      />
      {kind === "transfer" && (
        <AppText color={colors.secondary}>
          Move money between two tracked accounts. A transfer changes each
          account’s balance and counts as neither income nor spending.
        </AppText>
      )}
      {kind === "refund" && (
        <AppText color={colors.secondary}>
          Money returned to an account. Refunds are shown separately from new
          income and expenses.
        </AppText>
      )}
      <Field
        label="Title"
        value={merchant}
        onChangeText={(value) => {
          setMerchant(value);
          changed();
        }}
        placeholder={
          kind === "income"
            ? "e.g. Monthly allowance"
            : kind === "transfer"
              ? "e.g. Wallet top-up"
              : "e.g. Lunch at Pelita"
        }
        disabled={busy}
        maxLength={80}
      />
      <Field
        label="Amount (RM)"
        value={amount}
        onChangeText={(value) => {
          setAmount(value);
          setAmountError(undefined);
          changed();
        }}
        placeholder="0.00"
        keyboardType="decimal-pad"
        maxLength={24}
        disabled={busy}
        error={amountError}
        onBlur={() => {
          try {
            parseAmount(amount);
          } catch (failure) {
            setAmountError(errorMessage(failure));
          }
        }}
        hint="Use 12.50. Enter a positive amount for every transaction type."
      />
      <ChoiceGroup
        label={kind === "transfer" ? "From account" : "Payment account"}
        choices={snapshot.accounts.map((account) => ({
          value: account.id,
          label: account.name,
        }))}
        value={accountId}
        onChange={(value) => {
          setAccountId(value);
          if (value === target) setTarget("");
          changed();
        }}
        disabled={busy}
      />
      {kind === "transfer" &&
        (snapshot.accounts.length < 2 ? (
          <AppText color={colors.orange}>
            A transfer needs two accounts. Add another account in Settings
            first.
          </AppText>
        ) : (
          <ChoiceGroup
            label="To account"
            choices={snapshot.accounts
              .filter((account) => account.id !== accountId)
              .map((account) => ({ value: account.id, label: account.name }))}
            value={target}
            onChange={(value) => {
              setTarget(value);
              changed();
            }}
            disabled={busy}
          />
        ))}
      {(kind === "expense" || kind === "refund") && (
        <ChoiceGroup
          label="Category"
          choices={CATEGORY_IDS.map((id) => ({
            value: id,
            label: categories[id].label,
          }))}
          value={category}
          onChange={(value) => {
            setCategory(value as CategoryId);
            changed();
          }}
          disabled={busy}
        />
      )}
      <DateField
        value={date}
        onChange={(value) => {
          setDate(value);
          changed();
        }}
        disabled={busy}
      />
      <Field
        label="Description (optional)"
        value={description}
        onChangeText={(value) => {
          setDescription(value);
          changed();
        }}
        placeholder="Anything you’d like to remember"
        multiline
        disabled={busy}
      />
      <FormError message={error} />
      <AppButton
        label={busy ? "Saving…" : "Save transaction"}
        icon="checkmark-outline"
        disabled={busy}
        onPress={() => void save()}
      />
      {duplicate && (
        <AppButton
          label="Save as a separate transaction"
          variant="secondary"
          disabled={busy}
          onPress={() => void save(true)}
        />
      )}
      {editing && (
        <AppButton
          label="Delete transaction"
          variant="secondary"
          icon="trash-outline"
          disabled={busy}
          onPress={() => setConfirm(true)}
        />
      )}
      <ConfirmDelete
        visible={confirm}
        title="Delete this transaction?"
        detail="It will be removed and affected account balances will be recalculated. This cannot be undone."
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          void (async () => {
            try {
              await mutate((repository) =>
                repository.deleteTransaction(params.id),
              );
              setConfirm(false);
              back();
            } catch (failure) {
              setConfirm(false);
              setError(errorMessage(failure));
            }
          })();
        }}
      />
    </FormScreen>
  );
}
