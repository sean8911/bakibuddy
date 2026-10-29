import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { AppButton } from "./AppButton";
import { ChoiceGroup, Field, FormError } from "./FormFields";
import { DateField } from "./DateField";
import { categories } from "../constants/categories";
import { CATEGORY_IDS, type Account, type CategoryId, type TransactionKind } from "../types/finance";
import type { ImportDraft, Direction } from "../importing/types";
import { draftInput } from "../importing/review";
import { editableAmount, errorMessage, parseAmount, validateTransaction } from "../utils/validation";
import { colors, spacing } from "../theme/tokens";
export function ImportRowEditor({ row, accounts, accountId, today, onSave, onCancel }: {
    row: ImportDraft;
    accounts: Account[];
    accountId: string;
    today: string;
    onSave: (row: ImportDraft) => void;
    onCancel: () => void;
}) {
    const [draft, setDraft] = useState(row), [amount, setAmount] = useState(editableAmount(row.amountSen)), [error, setError] = useState<string>();
    const patch = (value: Partial<ImportDraft>) => setDraft((prior) => ({ ...prior, ...value, duplicateApproved: false }));
    const incoming = draft.direction === "credit";
    return <View style={styles.editor} testID="import-row-editor">
    <AppText variant="title">Review row {row.index}</AppText>
    <AppText variant="caption" color={colors.secondary}>Source: {row.sourceType} · Reference {row.reference}</AppText>
    <Field label="Transaction name" value={draft.merchant} onChangeText={(merchant) => patch({ merchant })} maxLength={100}/>
    <Field label="Amount (RM)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" maxLength={24}/>
    <DateField value={draft.date} onChange={(date) => patch({ date })} maximumDate={today}/>
    {row.direction === "unknown" ? <ChoiceGroup label="Wallet direction" value={draft.direction} choices={[{ value: "debit", label: "Money out" }, { value: "credit", label: "Money in" }]} onChange={(direction) => patch({ direction: direction as Direction, kind: "unresolved" })}/> : <AppText color={colors.secondary}>{incoming ? "Money into this eWallet" : "Money out of this eWallet"}</AppText>}
    <ChoiceGroup label="Transaction type" value={draft.kind} choices={incoming ? [{ value: "income", label: "New income" }, { value: "refund", label: "Refund" }, { value: "transfer", label: "Between my accounts" }] : [{ value: "expense", label: "Expense" }, { value: "transfer", label: "Between my accounts" }]} onChange={(kind) => patch({ kind: kind as TransactionKind })}/>
    <AppText variant="caption" color={colors.secondary}>A reload from your own bank is a transfer, not new income. Add the other account first, or leave this row excluded.</AppText>
    {draft.kind === "transfer" ? <ChoiceGroup label={incoming ? "From my account" : "To my account"} value={draft.otherAccountId} choices={accounts.filter((a) => a.id !== accountId).map((a) => ({ value: a.id, label: a.name }))} onChange={(otherAccountId) => patch({ otherAccountId })}/> : <ChoiceGroup label="Category" value={draft.category} choices={CATEGORY_IDS.map((id) => ({ value: id, label: categories[id].label }))} onChange={(category) => patch({ category: category as CategoryId })}/>}
    <FormError message={error}/>
    <AppButton label="Apply row changes" onPress={() => {
            try {
                const next = { ...draft, amountSen: parseAmount(amount), duplicateApproved: false };
                validateTransaction(draftInput(next, accountId), today);
                onSave(next);
            }
            catch (failure) {
                setError(errorMessage(failure));
            }
        }}/>
    <AppButton label="Cancel row changes" variant="secondary" onPress={onCancel}/>
  </View>;
}
const styles = StyleSheet.create({ editor: { gap: spacing.lg, paddingVertical: spacing.lg } });
