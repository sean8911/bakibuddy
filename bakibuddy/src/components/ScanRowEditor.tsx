import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Account, CategoryId, TransactionInput, TransactionKind } from '../types/finance';
import { CATEGORY_IDS } from '../types/finance';
import type { ScanDraft } from '../scanning/types';
import { scanInput, scanPossibleMatch } from '../scanning/review';
import { errorMessage, LedgerError, validateTransaction } from '../utils/validation';
import { categories } from '../constants/categories';
import { colors, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { ChoiceGroup, Field, FormError } from './FormFields';
import { DateField } from './DateField';
import { Icon } from './Icon';

export function ScanCheck({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} aria-checked={checked} disabled={disabled} onPress={onChange} style={({ pressed }) => [styles.check, pressed && styles.pressed]}>
    <Icon name={checked ? 'checkbox-outline' : 'square-outline'} color={colors.emerald} size={24} />
    <AppText style={styles.flex}>{label}</AppText>
  </Pressable>;
}
export function ScanRowEditor({ row, accountId, accounts, today, otherRecords, onSave, onCancel }: { row: ScanDraft; accountId: string; accounts: Account[]; today: string; otherRecords: TransactionInput[]; onSave: (row: ScanDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(row), [attested, setAttested] = useState(false), [error, setError] = useState<string>();
  const patch = (value: Partial<ScanDraft>) => { setDraft(prior => ({ ...prior, ...value, duplicateApproved: false })); setAttested(false); setError(undefined); };
  let duplicate = false;
  try { duplicate = otherRecords.some(other => scanPossibleMatch(scanInput(draft, accountId), other)); } catch { /* Invalid fields are explained on apply. */ }
  return <View style={styles.editor} testID="scan-row-editor">
    <AppText variant="title">Review row {row.index}</AppText>
    <AppText color={colors.secondary}>Compare the image and every field. Categories start as Other. A transfer to another person can be an expense; money between your own accounts is a transfer.</AppText>
    {row.warnings.map(message => <AppText key={message} color={colors.amber}>{message}</AppText>)}
    <Field label="Transaction name" value={draft.merchant} onChangeText={merchant => patch({ merchant })} maxLength={80} />
    <Field label="Amount (RM)" value={draft.amount} onChangeText={amount => patch({ amount })} keyboardType="decimal-pad" maxLength={24} />
    <DateField value={draft.date} onChange={date => patch({ date })} maximumDate={today} />
    <ChoiceGroup label="Transaction type" value={draft.kind} choices={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'New income' }, { value: 'refund', label: 'Refund' }, { value: 'transfer', label: 'Between my accounts' }]} onChange={kind => patch({ kind: kind as TransactionKind })} />
    {draft.kind === 'transfer' ? <>
      <ChoiceGroup label="Transfer direction" value={draft.direction} choices={[{ value: 'debit', label: 'Out of selected account' }, { value: 'credit', label: 'Into selected account' }]} onChange={direction => patch({ direction: direction as 'debit' | 'credit' })} />
      <ChoiceGroup label="Other tracked account" value={draft.otherAccountId} choices={accounts.filter(account => account.id !== accountId).map(account => ({ value: account.id, label: account.name }))} onChange={otherAccountId => patch({ otherAccountId })} />
      {accounts.length < 2 && <AppText color={colors.amber}>Add the other account before scanning a transfer. You can cancel this scan and manage accounts in Settings.</AppText>}
    </> : <ChoiceGroup label="Category" value={draft.category} choices={CATEGORY_IDS.map(id => ({ value: id, label: categories[id].label }))} onChange={category => patch({ category: category as CategoryId })} />}
    {duplicate && <>
      <FormError message="A record has the same date, amount and a shared account. It may already be recorded, even if its name or type differs." />
      <ScanCheck label="This is a separate payment, not the existing record" checked={draft.duplicateApproved} onChange={() => setDraft(prior => ({ ...prior, duplicateApproved: !prior.duplicateApproved }))} />
    </>}
    <ScanCheck label="I checked the name, amount, date and type against the image" checked={attested} onChange={() => setAttested(prior => !prior)} />
    <FormError message={error} />
    <AppButton label="Include reviewed row" onPress={() => {
      try {
        if (!attested) throw new LedgerError('Check every field against the image, then tick the review confirmation.');
        validateTransaction(scanInput(draft, accountId), today);
        if (duplicate && !draft.duplicateApproved) throw new LedgerError('Exclude this row or confirm it is a separate payment.');
        onSave({ ...draft, reviewed: true, include: true });
      } catch (failure) { setError(errorMessage(failure)); }
    }} />
    <AppButton label="Cancel row changes" variant="secondary" onPress={onCancel} />
    <AppText variant="label">Recognized source text</AppText>
    <AppText selectable color={colors.secondary}>{row.sourceText}</AppText>
  </View>;
}
const styles = StyleSheet.create({ editor: { gap: spacing.lg }, check: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }, flex: { flex: 1 }, pressed: { opacity: 0.7 } });
