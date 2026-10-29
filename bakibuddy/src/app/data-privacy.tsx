import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Field, FormError } from '../components/FormFields';
import { FormScreen } from '../components/FormScreen';
import { ScanCheck } from '../components/ScanRowEditor';
import { useFinance } from '../state/FinanceProvider';
import { createLedgerExport, ledgerRevision, type ExportFormat } from '../privacy/export';
import { shareLedgerExport } from '../privacy/share-export';
import { privacyNotice } from '../privacy/notice';
import { errorMessage, LedgerError } from '../utils/validation';
import { colors, spacing } from '../theme/tokens';

export default function DataPrivacyScreen() {
  const {snapshot,busy,mutate} = useFinance();
  const [review,setReview] = useState<string|null>(null), [format,setFormat] = useState<ExportFormat|null>(null), [notice,setNotice] = useState(false);
  const [typed,setTyped] = useState(''), [acknowledged,setAcknowledged] = useState(false), [exporting,setExporting] = useState(false);
  const [status,setStatus] = useState(''), [error,setError] = useState<string>();
  const working = useRef(false), mounted = useRef(true);
  const revision = ledgerRevision(snapshot), locked = busy || exporting;
  const hasRecords = snapshot.accounts.length > 0 || snapshot.transactions.length > 0 || !!snapshot.budget.plan || snapshot.budget.items.length > 0 || snapshot.imports.receipts.length > 0 || snapshot.scans.length > 0;
  const reset = useCallback(() => {setReview(null);setFormat(null);setNotice(false);setTyped('');setAcknowledged(false);setError(undefined);},[]);
  useFocusEffect(useCallback(() => () => { reset(); },[reset]));
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {if(state !== 'active' && !working.current) reset();});
    return () => {mounted.current = false;subscription.remove();};
  },[reset]);
  const exportRecords = async () => {
    if(!format || locked || working.current) return;
    working.current = true;setExporting(true);setError(undefined);setStatus('');
    try {
      const output = createLedgerExport(snapshot,format);
      const message = await shareLedgerExport(output);
      if(mounted.current) {setStatus(message);setFormat(null);}
    } catch(failure) {if(mounted.current) setError(failure instanceof LedgerError ? failure.message : 'The export did not finish. Your ledger is unchanged. Check your chosen destination, then try again.');}
    finally {working.current = false;if(mounted.current)setExporting(false);}
  };
  const deleteRecords = async () => {
    if(!review || review !== revision || typed !== 'DELETE' || !acknowledged || locked || working.current) return;
    working.current = true;setError(undefined);setStatus('');
    try {
      await mutate(repository => repository.deleteAllLocalRecords(review));
      if(mounted.current) {reset();setStatus('Local records deleted. This ledger is now empty. External copies and device backups are unchanged.');}
    } catch(failure) {if(mounted.current) {setTyped('');setAcknowledged(false);setError(errorMessage(failure));}}
    finally {working.current = false;}
  };
  const counts = <View style={styles.group} testID="privacy-counts"><AppText color={colors.secondary}>Accounts: {snapshot.accounts.length} · Transactions: {snapshot.transactions.length} · Schedules: {snapshot.budget.items.length} · Payment links: {snapshot.budget.settlements.length}</AppText><AppText color={colors.secondary}>Budget plan: {snapshot.budget.plan ? 'set' : 'not set'} · PDF markers: {snapshot.imports.receipts.length} · Image markers: {snapshot.scans.length}</AppText></View>;
  return <FormScreen key={review ? 'delete' : format ?? (notice ? 'notice' : 'controls')} title={review ? 'Delete local records?' : format ? 'Review your export' : notice ? 'Privacy notice' : 'Privacy & data'} busy={locked}>
    {review ? <View style={styles.group} testID="delete-data-review">
      <AppText>Delete all accounts, opening balances, transactions, budget settings, schedules, payment links and PDF/image duplicate markers stored in this ledger. This cannot be undone in BakiBuddy.</AppText>
      {counts}
      <AppText color={colors.secondary}>Export first if you need a reference copy. This version cannot restore an archive. Exported files, source PDFs/photos, other devices, Groq logs and device backups are outside this deletion. Logical deletion is not guaranteed secure erasure.</AppText>
      {review !== revision && <FormError message="Your records changed. Cancel and review deletion again. Nothing was deleted." />}
      <ScanCheck label="I understand this deletes all local financial records and cannot be undone" checked={acknowledged} disabled={locked} onChange={() => setAcknowledged(value => !value)} />
      <Field label="Type DELETE to confirm" value={typed} onChangeText={setTyped} maxLength={6} disabled={locked} hint="Type the uppercase word DELETE." />
      <FormError message={error} />
      <AppButton label={busy ? 'Deleting local records…' : 'Delete all local records'} variant="danger" disabled={locked || review !== revision || typed !== 'DELETE' || !acknowledged} onPress={() => {void deleteRecords();}} />
      <AppButton label="Cancel deletion" variant="secondary" disabled={locked} onPress={reset} />
    </View> : format ? <View style={styles.group} testID="export-review">
      <AppText variant="title">{format === 'json' ? 'JSON reference archive' : 'Transaction CSV'}</AppText>
      {counts}
      <AppText>{format === 'json' ? 'Includes all accounts and opening balances, transactions and notes, budget settings, schedules, payment links and hashed import/image duplicate markers. Amounts are exact integer sen. It excludes source documents, images, passwords and connection credentials.' : 'Includes transactions, names, notes, dates, types, categories, amounts in sen and MYR, and both account names/identifiers for transfers. It excludes opening balances, budget settings, schedules and duplicate markers. Formula-like text is prefixed for safer spreadsheet opening; JSON preserves original text.'}</AppText>
      <AppText color={colors.amber}>This file is unencrypted and may contain sensitive financial details. Choose a private destination. A sharing app may upload it under its own terms. Files are limited to 20 MB.</AppText>
      <AppText color={colors.secondary}>This is a reference copy. Restoring an archive is unavailable. Exporting does not change your ledger. Check that the saved file opens before relying on it.</AppText>
      <FormError message={error} />
      <AppButton label={exporting ? 'Preparing export…' : 'Choose export destination'} disabled={locked} onPress={() => {void exportRecords();}} />
      <AppButton label="Cancel export" variant="secondary" disabled={locked} onPress={reset} />
    </View> : notice ? <View style={styles.group} testID="privacy-notice">
      {privacyNotice.map(section => <View key={section.title} style={styles.group}><AppText variant="title" accessibilityRole="header">{section.title}</AppText><AppText color={colors.secondary}>{section.text}</AppText></View>)}
      <AppButton label="Read Groq data policy" variant="secondary" onPress={() => {void Linking.openURL('https://console.groq.com/docs/your-data').catch(() => setError('The policy could not be opened. Try again when connected.'));}} />
      <FormError message={error} />
      <AppButton label="Back to data controls" variant="secondary" onPress={reset} />
    </View> : <>
      <AppText>Your financial records are stored on this device. Choose what to copy or remove.</AppText>
      {counts}
      {!!status && <AppText accessibilityLiveRegion="polite" testID="privacy-status">{status}</AppText>}
      <View style={styles.section}>
        <AppText variant="title" accessibilityRole="header">Take a copy</AppText>
        <AppText color={colors.secondary}>Review the contents before choosing a destination. JSON includes the full ledger; CSV contains transactions. Both files are unencrypted. Restore is unavailable.</AppText>
        <AppButton label="Review JSON export" icon="download-outline" variant="secondary" disabled={locked} onPress={() => {reset();setStatus('');setFormat('json');}} />
        <AppButton label="Review transaction CSV" variant="secondary" disabled={locked} onPress={() => {reset();setStatus('');setFormat('csv');}} />
      </View>
      <View style={styles.section}>
        <AppText variant="title" accessibilityRole="header">How your data is handled</AppText>
        <AppText color={colors.secondary}>The ledger has no app-managed encryption in Expo Go. Optional Groq requests require a separate preview and approval. Learn about local files, exports and cloud retention.</AppText>
        <AppButton label="Read privacy notice" variant="secondary" onPress={() => {reset();setNotice(true);}} />
      </View>
      <View style={styles.section}>
        <AppText variant="title" accessibilityRole="header">Remove local records</AppText>
        <AppText color={colors.secondary}>Review everything that will be removed before confirming. Keep an export if needed; deletion cannot be undone in this app.</AppText>
        {!hasRecords && <AppText color={colors.secondary}>There are no local financial records to delete.</AppText>}
        <AppButton label="Review local data deletion" variant="secondary" disabled={locked || !hasRecords} onPress={() => {reset();setStatus('');setReview(revision);}} />
      </View>
    </>}
  </FormScreen>;
}
const styles = StyleSheet.create({group:{gap:spacing.lg},section:{gap:spacing.lg,paddingTop:spacing.xl,borderTopWidth:1,borderTopColor:colors.line}});
