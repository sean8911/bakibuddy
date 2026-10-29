import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { ChoiceGroup, FormError } from '../components/FormFields';
import { FormScreen } from '../components/FormScreen';
import { ScanCheck, ScanRowEditor } from '../components/ScanRowEditor';
import { importTotals } from '../importing/review';
import { OcrReader } from '../scanning/OcrReader';
import type { OcrJob } from '../scanning/ocr-bridge';
import { pickScanImage } from '../scanning/pick-image';
import { parseScan } from '../scanning/parse';
import { prepareScanDrafts, scanInput, selectedScanRecords } from '../scanning/review';
import type { OcrExtraction, ScanDraft, ScanMode, ScanRecord } from '../scanning/types';
import { useFinance } from '../state/FinanceProvider';
import { colors, radius, spacing } from '../theme/tokens';
import { longFinancialDate } from '../utils/dates';
import { formatMYR } from '../utils/money';
import { errorMessage, LedgerError, parseAmount } from '../utils/validation';

const hash = (value: string) => digestStringAsync(CryptoDigestAlgorithm.SHA256, value);
const PAGE_SIZE = 5;
export default function ScanReceiptScreen() {
  const router = useRouter(), { snapshot, mutate, today, busy } = useFinance(), viewport = useWindowDimensions();
  const [accountId, setAccountId] = useState(snapshot.accounts[0]?.id ?? ''), [mode, setMode] = useState<ScanMode>('receipt');
  const [image, setImage] = useState<{ uri: string; name: string; width: number; height: number; hash: string } | null>(null);
  const [choosing, setChoosing] = useState(false), [reading, setReading] = useState(false), [job, setJob] = useState<OcrJob | null>(null), [progress, setProgress] = useState('');
  const [rows, setRows] = useState<ScanDraft[]>([]), [text, setText] = useState(''), [showText, setShowText] = useState(false), [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string>(), [editing, setEditing] = useState<string>(), [page, setPage] = useState(0), [confirm, setConfirm] = useState<ScanRecord[] | null>(null), [saved, setSaved] = useState(0), [scanned, setScanned] = useState(false);
  const [continuationError, setContinuationError] = useState<string>();
  const active = useRef<string | null>(null), mounted = useRef(true), picking = useRef(false);
  const discard = () => { active.current = null; setJob(null); setReading(false); setImage(null); setRows([]); setText(''); setConfirm(null); setEditing(undefined); setPage(0); setScanned(false); setExpanded(false); setShowText(false); setContinuationError(undefined); };
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background' && !picking.current) { active.current = null; setJob(null); setReading(false); setImage(null); setRows([]); setText(''); setConfirm(null); setEditing(undefined); setScanned(false); setError('The scan was cleared when the app left the foreground. Choose the image again. Saved records are unchanged.'); }
    });
    return () => { mounted.current = false; active.current = null; listener.remove(); };
  }, []);
  const fail = (message: string) => { active.current = null; setJob(null); setReading(false); setError(message); };
  const choose = async () => {
    if (picking.current) return;
    picking.current = true; setChoosing(true); setError(undefined);
    try {
      const selected = await pickScanImage();
      if (!selected) return;
      const imageHash = await hash(selected.base64);
      if (mounted.current) { discard(); setSaved(0); setImage({ uri: selected.uri, name: selected.name, width: selected.width, height: selected.height, hash: imageHash }); }
    } catch (failure) { if (mounted.current) setError(errorMessage(failure)); }
    finally { picking.current = false; if (mounted.current) setChoosing(false); }
  };
  const receive = async (extraction: OcrExtraction) => {
    const id = active.current;
    if (!id || !image) return;
    setJob(null); setProgress('Preparing rows for review…');
    try {
      const next = await prepareScanDrafts(parseScan(extraction, mode), image.hash, snapshot, hash, randomUUID);
      if (!mounted.current || active.current !== id) return;
      setRows(next); setText(extraction.text); setScanned(true); setReading(false); setPage(0); active.current = null;
    } catch (failure) { if (mounted.current && active.current === id) fail(errorMessage(failure)); }
  };
  const start = () => {
    if (!image || reading) return;
    setError(undefined); setScanned(false); setRows([]); setText(''); setConfirm(null); setEditing(undefined); setPage(0);
    const id = randomUUID(); active.current = id; setProgress('Preparing the local image reader…'); setReading(true);
    setJob({ id, base64: image.uri.slice(image.uri.indexOf(',')+1), mode });
  };
  const sourceImage = image && !confirm ? <View style={styles.group}>
    <AppText variant="label">Your source image</AppText>
    <Image source={{ uri: image.uri }} accessibilityLabel="Selected receipt or payment screenshot" resizeMode="contain" style={[styles.image, { height: expanded ? Math.min(viewport.width - 40,560) * image.height / image.width : 220 }]} />
    <AppButton label={expanded ? 'Collapse source image' : 'Show full source image'} variant="secondary" onPress={() => setExpanded(prior => !prior)} />
  </View> : null;
  const totals = confirm ? importTotals(confirm) : null;
  const otherRecords = [...snapshot.transactions,...rows.filter(row => row.include && row.id !== editing).flatMap(row => { try { return [scanInput(row, accountId)]; } catch { return []; } })];
  const visible = rows.slice(page * PAGE_SIZE, (page+1) * PAGE_SIZE);
  const selectedCount = rows.filter(row => row.include).length;
  return <FormScreen title="Scan receipt or screenshot" busy={busy}>
    <AppText color={colors.secondary}>Read an image on your device, check the details, then choose what to save. Images and recognized text are not stored with your records.</AppText>
    {!snapshot.accounts.length ? <>
      <AppText>Add an account first so each payment goes to the right place.</AppText>
      <AppButton label="Add an account for scanning" icon="wallet-outline" onPress={() => router.push('/account/new')} />
    </> : saved ? <>
      <AppText variant="title" accessibilityLiveRegion="polite">{saved} reviewed {saved === 1 ? 'transaction saved' : 'transactions saved'}.</AppText>
      <AppText color={colors.secondary}>Your balances, budget and Insights use these records. Link an applicable scheduled payment in Bills & income so it is not counted twice.</AppText>
      <AppButton label="View transactions" onPress={() => router.replace('/transactions')} />
      <AppButton label="Scan another image" variant="secondary" onPress={() => { discard(); setSaved(0); setError(undefined); }} />
    </> : confirm && totals ? <>
      <AppText variant="title">Confirm {confirm.length} reviewed {confirm.length === 1 ? 'transaction' : 'transactions'}</AppText>
      <AppText color={colors.secondary}>Selected account: {snapshot.accounts.find(account => account.id === accountId)?.name}. Only these reviewed rows will be saved. Transfers update both tracked accounts.</AppText>
      {confirm.map((record,index) => <View key={record.sourceKey} style={styles.row}>
        <AppText variant="label">{index+1}. {record.input.merchant}</AppText>
        <AppText>{longFinancialDate(record.input.date)} · {record.input.kind} · {formatMYR(record.input.amountSen)}</AppText>
        <AppText color={colors.secondary}>{record.input.kind === 'transfer' ? 'From account' : 'Account'}: {snapshot.accounts.find(account => account.id === record.input.accountId)?.name}{record.input.transferToAccountId ? ` · To account: ${snapshot.accounts.find(account => account.id === record.input.transferToAccountId)?.name}` : ''}</AppText>
      </View>)}
      <View style={styles.group} testID="scan-confirm-totals">
        <AppText>Expenses: {formatMYR(totals.expenses)}</AppText><AppText>Income: {formatMYR(totals.income)}</AppText><AppText>Refunds: {formatMYR(totals.refunds)}</AppText><AppText>Transfers: {formatMYR(totals.transfers)}</AppText>
      </View>
      <FormError message={error} />
      <AppButton label={busy ? 'Saving reviewed transactions…' : 'Confirm scanned transactions'} disabled={busy} onPress={() => {
        if (busy) return;
        setError(undefined);
        void mutate(repository => repository.saveScannedTransactions(confirm)).then(() => { if (mounted.current) { const count = confirm.length; discard(); setSaved(count); } }).catch(failure => { if (mounted.current) setError(errorMessage(failure)); });
      }} />
      <AppButton label="Back to scan review" variant="secondary" disabled={busy} onPress={() => { setConfirm(null); setError(undefined); }} />
    </> : <>
      {!rows.length && !reading && <>
        <ChoiceGroup label="Selected account" value={accountId} choices={snapshot.accounts.map(account => ({ value: account.id, label: account.name }))} onChange={value => { setAccountId(value); setError(undefined); }} />
        <ChoiceGroup label="Image layout" value={mode} choices={[{ value: 'receipt', label: 'Receipt or payment detail' }, { value: 'activity', label: 'TNG Activity list' }]} onChange={value => { setMode(value as ScanMode); setScanned(false); setText(''); }} />
        <AppText variant="caption" color={colors.secondary}>Printed Latin text and MYR amounts · JPEG/PNG · up to 10 MB, 12 megapixels and 50 transactions. For long histories, use Import TNG with the original PDF.</AppText>
        <AppText variant="caption" color={colors.secondary}>Choose the correct layout. A QR code does not prove payment. Rewards, balances and receipt line items are not separate transactions.</AppText>
        <AppButton label={choosing ? 'Opening image picker…' : 'Choose image'} icon="image-outline" disabled={choosing || busy} onPress={() => void choose()} />
      </>}
      {sourceImage}
      <FormError message={error} />
      {reading ? <View style={styles.group}>
        <ActivityIndicator color={colors.emerald} accessibilityLabel="Reading image locally" />
        <AppText accessibilityLiveRegion="polite">{progress}</AppText>
        <AppButton label="Cancel image reading" variant="secondary" onPress={() => { discard(); setError(undefined); }} />
      </View> : editing ? <ScanRowEditor key={editing} row={rows.find(row => row.id === editing)!} accountId={accountId} accounts={snapshot.accounts} today={today} otherRecords={otherRecords} onSave={next => { setRows(prior => prior.map(row => row.id === next.id ? next : row)); setEditing(undefined); setError(undefined); setContinuationError(undefined); }} onCancel={() => { setEditing(undefined); setError(undefined); }} /> : rows.length ? <>
        <AppText variant="title">{rows.length} {rows.length === 1 ? 'candidate' : 'candidates'} to check</AppText>
        <AppText color={colors.secondary}>Account: {snapshot.accounts.find(account => account.id === accountId)?.name}. Text recognition can get names, amounts and dates wrong. Review every field against the image before including a row.</AppText>
        {visible.map(row => {
          let amount = 'Amount needed'; try { amount = formatMYR(parseAmount(row.amount)); } catch { /* Display missing state. */ }
          return <View key={row.id} style={styles.row}>
            <AppText variant="label">{row.index}. {row.merchant || 'Name needed'}</AppText>
            <AppText>{amount} · {row.date ? longFinancialDate(row.date) : 'Date and year needed'}</AppText>
            <AppText variant="caption" color={row.reviewed ? colors.emerald : colors.amber}>{row.locked ? 'Already saved from this image' : row.reviewed ? 'Reviewed' : 'Needs review'}{!row.locked && row.warnings.length ? ` · ${row.warnings.length} ${row.warnings.length === 1 ? 'item' : 'items'} to check` : ''}</AppText>
            {!row.locked && <>
              <AppButton label={`Review scan row ${row.index}`} variant="secondary" onPress={() => { setEditing(row.id); setError(undefined); }} />
              {row.reviewed && <ScanCheck label={`Include scan row ${row.index}`} checked={row.include} onChange={() => { setRows(prior => prior.map(other => other.id === row.id ? { ...other, include: !other.include } : other)); setContinuationError(undefined); }} />}
            </>}
          </View>;
        })}
        {rows.length > PAGE_SIZE && <View style={styles.group}>
          <AppText>Page {page+1} of {Math.ceil(rows.length/PAGE_SIZE)}</AppText>
          <AppButton label="Previous scan rows" variant="secondary" disabled={page === 0} onPress={() => setPage(prior => prior-1)} />
          <AppButton label="Next scan rows" variant="secondary" disabled={(page+1)*PAGE_SIZE >= rows.length} onPress={() => setPage(prior => prior+1)} />
        </View>}
        <AppText>{selectedCount} reviewed rows selected. Categories start as Other.</AppText>
        {!selectedCount && <AppText color={colors.secondary}>Review and include at least one row to continue. Already-saved rows cannot be selected.</AppText>}
        <FormError message={continuationError} />
        <AppButton label="Continue with reviewed rows" disabled={busy || selectedCount === 0} onPress={() => { try { if (!snapshot.accounts.some(account => account.id === accountId)) throw new LedgerError('Choose an existing account.'); setConfirm(selectedScanRecords(rows,accountId,snapshot,today)); setError(undefined); setContinuationError(undefined); } catch (failure) { setContinuationError(errorMessage(failure)); } }} />
        <AppButton label="Discard scan" variant="secondary" onPress={() => { discard(); setError(undefined); }} />
      </> : image && <>
        {scanned && <AppText color={colors.amber}>No supported payment rows were found. Try the other layout or a clearer image. You can also enter the transaction manually.</AppText>}
        <AppButton label={scanned ? 'Read image again' : 'Read image locally'} disabled={busy || choosing || !accountId} onPress={start} />
        <AppButton label="Discard selected image" variant="secondary" onPress={() => { discard(); setError(undefined); }} />
      </>}
      {text && !editing && <View style={styles.group}>
        <AppButton label={showText ? 'Hide recognized text' : 'Show recognized text'} variant="secondary" onPress={() => setShowText(prior => !prior)} />
        {showText && <AppText selectable color={colors.secondary}>{text}</AppText>}
      </View>}
      {!reading && !editing && <AppButton label="Enter a transaction manually" variant="secondary" onPress={() => { discard(); router.push('/transaction/new'); }} />}
    </>}
    {job && <OcrReader key={job.id} job={job} onResult={extraction => void receive(extraction)} onError={message => { if (active.current === job.id) fail(message); }} onProgress={message => { if (active.current === job.id) setProgress(message); }} />}
  </FormScreen>;
}
const styles = StyleSheet.create({ group: { gap: spacing.md }, row: { paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line, gap: spacing.md }, image: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.md } });
