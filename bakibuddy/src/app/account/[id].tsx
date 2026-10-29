import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { ConfirmDelete } from "../../components/ConfirmDelete";
import { ChoiceGroup, Field, FormError } from "../../components/FormFields";
import { FormScreen } from "../../components/FormScreen";
import { useFinance } from "../../state/FinanceProvider";
import type { AccountType } from "../../types/finance";
import {
  editableAmount,
  errorMessage,
  parseAmount,
} from "../../utils/validation";
import { colors } from "../../theme/tokens";

export default function AccountEditor() {
  const { id,type:requestedType } = useLocalSearchParams<{ id: string;type?:string }>();
  const router = useRouter();
  const { snapshot, mutate, busy } = useFinance();
  const editing = id !== "new";
  const original = snapshot.accounts.find((account) => account.id === id);
  const [newId] = useState(randomUUID);
  const [name, setName] = useState(original?.name ?? "");
  const [type, setType] = useState<AccountType>(original?.type ?? (requestedType==="ewallet"?"ewallet":"bank"));
  const [opening, setOpening] = useState(
    editableAmount(original?.openingBalanceSen ?? 0),
  );
  const [error, setError] = useState<string>();
  const [amountError, setAmountError] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/accounts");
  if (editing && !original)
    return (
      <FormScreen title="Account not found">
        <AppText>This account is no longer available.</AppText>
        <AppButton
          label="View accounts"
          onPress={() => router.replace("/accounts")}
        />
      </FormScreen>
    );
  const save = async () => {
    setError(undefined);
    try {
      const input = {
        id: editing ? id : newId,
        name,
        type,
        openingBalanceSen: parseAmount(opening, true),
      };
      await mutate((repository) => repository.saveAccount(input, editing));
      back();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };
  return (
    <FormScreen title={editing ? "Edit account" : "Add an account"} busy={busy}>
      <AppText color={colors.secondary}>
        Start with the balance before any transactions you’ll record here.
        Transactions already included in this balance should not be added again.
      </AppText>
      <Field
        label="Account name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Maybank or Touch ’n Go"
        maxLength={60}
        disabled={busy}
      />
      <ChoiceGroup
        label="Account type"
        choices={[
          { value: "bank", label: "Bank" },
          { value: "ewallet", label: "eWallet" },
          { value: "cash", label: "Cash" },
          { value: "other", label: "Other" },
        ]}
        value={type}
        onChange={(value) => setType(value as AccountType)}
        disabled={busy}
      />
      <Field
        label="Opening balance (RM)"
        value={opening}
        onChangeText={(value) => {
          setOpening(value);
          setAmountError(undefined);
        }}
        keyboardType="numbers-and-punctuation"
        hint="Use 125.50. Negative opening balances are supported."
        error={amountError}
        onBlur={() => {
          try {
            parseAmount(opening, true);
          } catch (failure) {
            setAmountError(errorMessage(failure));
          }
        }}
        disabled={busy}
        maxLength={24}
      />
      {editing && (
        <AppText color={colors.secondary}>
          Changing the opening balance recalculates this account’s recorded
          balance. Your transactions stay intact.
        </AppText>
      )}
      <FormError message={error} />
      <AppButton
        label={busy ? "Saving…" : "Save account"}
        onPress={() => void save()}
        disabled={busy}
        icon="checkmark-outline"
      />
      {editing && (
        <AppButton
          label="Delete account"
          variant="secondary"
          disabled={busy}
          onPress={() => setConfirm(true)}
          icon="trash-outline"
        />
      )}
      <ConfirmDelete
        visible={confirm}
        title="Delete this account?"
        detail="Only accounts without transactions can be removed. This cannot be undone."
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          void (async () => {
            try {
              await mutate((repository) => repository.deleteAccount(id));
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
