import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { ChoiceGroup, Field, FormError } from "../components/FormFields";
import { FormScreen } from "../components/FormScreen";
import { ImportRowEditor } from "../components/ImportRowEditor";
import { Icon } from "../components/Icon";
import { PdfReader } from "../importing/PdfReader";
import type { PdfJob } from "../importing/pdf-bridge";
import { pickPdf } from "../importing/pick-pdf";
import { parseTngStatement } from "../importing/tng-parser";
import { draftInput, importTotals, possibleMatch, prepareDrafts, selectedRecords } from "../importing/review";
import type { ImportDraft, ImportRecord, PdfExtraction, TngStatement } from "../importing/types";
import { useFinance } from "../state/FinanceProvider";
import { colors, spacing } from "../theme/tokens";
import { errorMessage } from "../utils/validation";
import { longFinancialDate } from "../utils/dates";
import { formatMYR } from "../utils/money";
const hash = (value: string) => digestStringAsync(CryptoDigestAlgorithm.SHA256, value);
const PAGE_SIZE = 10;
export default function ImportTngScreen() {
    const router = useRouter(), { snapshot, mutate, busy, today } = useFinance();
    const [accountId, setAccountId] = useState(snapshot.accounts.find((a) => a.type === "ewallet")?.id ?? "");
    const [file, setFile] = useState<{
        name: string;
        base64: string;
    } | null>(null), [password, setPassword] = useState("");
    const [job, setJob] = useState<PdfJob | null>(null), [reading, setReading] = useState(false), [progress, setProgress] = useState("");
    const [statement, setStatement] = useState<TngStatement | null>(null), [rows, setRows] = useState<ImportDraft[]>([]), [walletHash, setWalletHash] = useState("");
    const [confirm, setConfirm] = useState<ImportRecord[] | null>(null), [error, setError] = useState<string>(), [saved, setSaved] = useState(0);
    const [filter, setFilter] = useState("all"), [page, setPage] = useState(0), [editing, setEditing] = useState<string>();
    const active = useRef<string | null>(null), mounted = useRef(true), picking = useRef(false);
    useEffect(() => {
        mounted.current = true;
        const listener = AppState.addEventListener("change", (state) => {
            if (state !== "active") {
                setPassword("");
                if (active.current) {
                    active.current = null;
                    setJob(null);
                    setReading(false);
                    setFile(null);
                    setError("Reading paused when the app left the foreground. Choose the statement again.");
                }
            }
        });
        return () => { mounted.current = false; active.current = null; listener.remove(); };
    }, []);
    const cancelRead = () => { active.current = null; setJob(null); setReading(false); setPassword(""); setFile(null); setProgress(""); };
    const reset = () => { cancelRead(); setStatement(null); setRows([]); setConfirm(null); setWalletHash(""); setError(undefined); setEditing(undefined); setPage(0); setFilter("all"); };
    const failRead = (message: string) => { active.current = null; setJob(null); setReading(false); setPassword(""); setError(message); };
    const receive = async (extraction: PdfExtraction) => {
        const id = active.current;
        if (!id)
            return;
        setJob(null);
        setPassword("");
        setProgress("Preparing transactions for review…");
        try {
            const parsed = parseTngStatement(extraction, today), drafts = await prepareDrafts(parsed, accountId, snapshot, hash, randomUUID);
            if (!mounted.current || active.current !== id)
                return;
            setStatement(parsed);
            setRows(drafts.rows);
            setWalletHash(drafts.walletHash);
            setFile(null);
            setReading(false);
            setPage(0);
            active.current = null;
        }
        catch (failure) {
            if (mounted.current && active.current === id)
                failRead(errorMessage(failure));
        }
    };
    const pick = async () => {
        if (picking.current)
            return;
        picking.current = true;
        setError(undefined);
        try {
            const next = await pickPdf();
            if (next && mounted.current) {
                setFile(next);
                setPassword("");
            }
        }
        catch (failure) {
            if (mounted.current)
                setError(errorMessage(failure));
        }
        finally {
            picking.current = false;
        }
    };
    const account = snapshot.accounts.find((a) => a.id === accountId), selected = rows.filter((row) => row.include).length;
    const needsReview = (row: ImportDraft) => !row.lockedReason && (row.kind === "unresolved" || row.direction === "unknown");
    const matching = (row: ImportDraft) => {
        try {
            const input = draftInput(row, accountId);
            return snapshot.transactions.some((other) => possibleMatch(input, other)) || rows.some((other) => other.id !== row.id && other.include && !other.lockedReason && (() => { try {
                return possibleMatch(input, draftInput(other, accountId));
            }
            catch {
                return false;
            } })());
        }
        catch {
            return false;
        }
    };
    const filtered = rows.filter((row) => filter === "all" || filter === "selected" && row.include || filter === "review" && needsReview(row));
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), currentPage = Math.min(page, pages - 1);
    const patch = (id: string, value: Partial<ImportDraft>) => { setRows((prior) => prior.map((row) => row.id === id ? { ...row, ...value } : row)); setError(undefined); };
    if (saved)
        return <FormScreen title="Import complete">
    <AppText variant="title">{saved} transactions saved</AppText>
    <AppText color={colors.secondary}>Your balances, budget and insights now include these records. Their statement references prevent another import of the same rows.</AppText>
    <AppButton label="View transactions" onPress={() => router.replace("/transactions")}/>
    <AppButton label="Import another statement" variant="secondary" onPress={() => { reset(); setSaved(0); }}/>
  </FormScreen>;
    if (confirm) {
        const totals = importTotals(confirm);
        return <FormScreen title="Confirm your import" busy={busy}>
    <AppText variant="title">{confirm.length} transactions → {account?.name}</AppText>
    <AppText color={colors.secondary}>{rows.length - confirm.length} wallet rows excluded. Your reviewed names, dates, amounts and types will be saved together.</AppText>
    <View style={styles.summary}>
      <AppText>Expenses · {formatMYR(totals.expenses)}</AppText>
      <AppText>New income · {formatMYR(totals.income)}</AppText>
      <AppText>Refunds · {formatMYR(totals.refunds)}</AppText>
      <AppText>Between your accounts · {formatMYR(totals.transfers)}</AppText>
    </View>
    <AppText color={colors.secondary}>Transfers move money between tracked accounts and do not count as income or spending. The statement’s wallet balance will not replace your opening balance.</AppText>
    <FormError message={error}/>
    <AppButton label={busy ? "Importing…" : "Confirm import"} disabled={busy} icon="checkmark-outline" onPress={() => {
                void (async () => { try {
                    await mutate((repository) => repository.importTransactions(accountId, walletHash, confirm));
                    setSaved(confirm.length);
                    setConfirm(null);
                    setRows([]);
                    setStatement(null);
                }
                catch (failure) {
                    setError(errorMessage(failure));
                } })();
            }}/>
    <AppButton label="Back to review" variant="secondary" disabled={busy} onPress={() => { setConfirm(null); setError(undefined); }}/>
  </FormScreen>;
    }
    return <FormScreen title={statement ? "Review your statement" : "Import TNG statement"} busy={busy}>
    {job && <PdfReader key={job.id} job={job} onResult={(value) => void receive(value)} onError={failRead} onProgress={(number, total) => setProgress(`Reading page ${number} of ${total}…`)}/>}
    {!statement ? <>
      <AppText color={colors.secondary}>Choose your original TNG eWallet PDF. It stays on this device. You’ll review every selection before saving.</AppText>
      <ChoiceGroup label="Import into eWallet" value={accountId} disabled={reading} choices={snapshot.accounts.filter((a) => a.type === "ewallet").map((a) => ({ value: a.id, label: a.name }))} onChange={setAccountId}/>
      {!snapshot.accounts.some((a) => a.type === "ewallet") && <AppText color={colors.secondary}>Add your TNG eWallet account to get started.</AppText>}
      <AppButton label="Add eWallet account" variant="secondary" disabled={reading} icon="add-outline" onPress={() => router.push({ pathname: "/account/[id]", params: { id: "new", type: "ewallet" } })}/>
      <AppText variant="caption" color={colors.secondary}>Use the balance before the transactions you plan to import. A current balance that already includes them would count them twice.</AppText>
      {!reading && <AppButton label={file ? "Choose a different PDF" : "Choose TNG PDF"} variant="secondary" icon="document-outline" disabled={!account || account.type !== "ewallet"} onPress={() => void pick()}/>}
      {file && !reading && <>
        <AppText variant="label">{file.name}</AppText>
        <Field label="PDF opening password (if required)" value={password} onChangeText={setPassword} secureTextEntry maxLength={128} hint="Only used to open this file. It is cleared after reading and is never saved."/>
        <AppButton label="Read statement" icon="download-outline" onPress={() => { const id = randomUUID(); active.current = id; setError(undefined); setProgress("Opening PDF locally…"); setReading(true); setJob({ id, base64: file.base64, password }); setPassword(""); }}/>
      </>}
      {reading && <View style={styles.summary} accessibilityLiveRegion="polite"><ActivityIndicator color={colors.emerald}/><AppText>{progress}</AppText><AppButton label="Cancel reading" variant="secondary" onPress={cancelRead}/></View>}
      <FormError message={error}/>
      <AppText variant="caption" color={colors.secondary}>Supports the verified landscape TNG wallet table, up to 5 MB and 100 pages. GO+ appendix rows are excluded. Scans and screenshots are not supported yet.</AppText>
    </> : <>
      <View style={styles.summary}>
        <AppText variant="title">{rows.length} wallet transactions</AppText>
        <AppText color={colors.secondary}>{longFinancialDate(statement.startDate)} – {longFinancialDate(statement.endDate)}</AppText>
        <AppText variant="caption" color={colors.secondary}>{account?.name} · Wallet ending {statement.walletId.slice(-4)} · {statement.pageCount} pages</AppText>
        <AppText variant="caption" color={colors.secondary}>{statement.goPlusRows} GO+ appendix rows and {statement.unsuccessfulRows} unsuccessful wallet rows excluded.</AppText>
      </View>
      <AppText color={colors.secondary}>Check names, dates and amounts. Suggested payments use Other until you choose a category. Classify incoming money and transfers yourself; a reload from your own account is not income.</AppText>
      <AppButton label="Select suggested payments" variant="secondary" onPress={() => setRows((prior) => prior.map((row) => ({ ...row, include: row.include || row.kind === "expense" && !row.lockedReason && !matching(row) })))}/>
      <AppButton label="Clear selection" variant="secondary" onPress={() => setRows((prior) => prior.map((row) => ({ ...row, include: false })))}/>
      <AppText variant="title" accessibilityLiveRegion="polite">{selected} selected · {rows.filter(needsReview).length} need classification</AppText>
      <FormError message={error}/>
      <AppButton label={`Continue with ${selected} selected`} disabled={!selected || !!editing} onPress={() => { try {
            const records = selectedRecords(rows, accountId, snapshot, today);
            importTotals(records);
            setConfirm(records);
            setError(undefined);
        }
        catch (failure) {
            setError(errorMessage(failure));
        } }}/>
      <ChoiceGroup label="Show rows" value={filter} choices={[{ value: "all", label: "All" }, { value: "review", label: "Need classification" }, { value: "selected", label: "Selected" }]} onChange={(value) => { setFilter(value); setPage(0); setEditing(undefined); }}/>
      {!filtered.length && <AppText color={colors.secondary}>No rows in this view. Choose All to see the statement.</AppText>}
      <View>{filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((row) => {
                const duplicate = matching(row);
                return <View key={row.id} style={styles.row} testID={`import-row-${row.index}`}>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`Include row ${row.index}: ${row.merchant}`} accessibilityState={{ checked: row.include, disabled: !!row.lockedReason }} disabled={!!row.lockedReason} onPress={() => patch(row.id, { include: !row.include })} style={styles.select}>
            <Icon name={row.include ? "checkbox" : "square-outline"} size={24} color={row.lockedReason ? colors.secondary : colors.emerald}/>
            <View style={styles.rowText}><AppText variant="label">{row.index}. {row.merchant}</AppText><AppText variant="caption" color={colors.secondary}>{row.date} · {row.sourceType}</AppText><AppText variant="label">{formatMYR(row.amountSen)} · {row.kind === "unresolved" ? "Choose type" : row.kind}</AppText></View>
          </Pressable>
          {row.lockedReason ? <AppText variant="caption" color={colors.orange}>{row.lockedReason}</AppText> : <>
            {duplicate && <><AppText variant="caption" color={colors.orange}>Possible duplicate: matching date, amount and accounts{row.kind !== "transfer" ? ", name and type" : " and type"}. Check your history.</AppText><Pressable accessibilityRole="checkbox" accessibilityLabel={`Row ${row.index} is a separate transaction`} accessibilityState={{ checked: row.duplicateApproved }} style={styles.select} onPress={() => patch(row.id, { duplicateApproved: !row.duplicateApproved })}><Icon name={row.duplicateApproved ? "checkbox" : "square-outline"} color={colors.emerald} size={24}/><AppText style={styles.rowText}>This is a separate transaction</AppText></Pressable></>}
            {editing === row.id ? <ImportRowEditor key={row.id} row={row} accounts={snapshot.accounts} accountId={accountId} today={today} onSave={(next) => { patch(row.id, { ...next, include: true }); setEditing(undefined); }} onCancel={() => setEditing(undefined)}/> : <AppButton label={`Review row ${row.index}`} variant="secondary" onPress={() => setEditing(row.id)}/>}
          </>}
        </View>;
            })}</View>
      <View style={styles.pagination}><AppButton label="Previous rows" variant="secondary" disabled={currentPage === 0 || !!editing} onPress={() => setPage(currentPage - 1)}/><AppText>Page {currentPage + 1} of {pages}</AppText><AppButton label="Next rows" variant="secondary" disabled={currentPage >= pages - 1 || !!editing} onPress={() => setPage(currentPage + 1)}/></View>
      <AppButton label="Choose another statement" variant="secondary" onPress={reset}/>
      <AppText variant="caption" color={colors.secondary}>Nothing is saved until you confirm the import.</AppText>
    </>}
  </FormScreen>;
}
const styles = StyleSheet.create({ summary: { gap: spacing.sm }, row: { paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line, gap: spacing.sm }, select: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }, rowText: { flex: 1, minWidth: 0 }, pagination: { gap: 12, alignItems: "stretch" } });
