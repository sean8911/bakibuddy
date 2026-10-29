import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { categoryRevision, categorySuggestions } from '../assistant/categorize';
import type { CategorySuggestion } from '../assistant/types';
import { CATEGORY_LABELS } from '../constants/category-labels';
import { CATEGORY_IDS, type CategoryId } from '../types/finance';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { AssistantCloud, type CloudChoice } from '../components/AssistantCloud';
import { ChoiceGroup, FormError } from '../components/FormFields';
import { FormScreen } from '../components/FormScreen';
import { ScanCheck } from '../components/ScanRowEditor';
import { useFinance } from '../state/FinanceProvider';
import { colors, spacing } from '../theme/tokens';
import { longFinancialDate } from '../utils/dates';
import { formatMYR } from '../utils/money';
import { errorMessage } from '../utils/validation';

export { ErrorBoundary } from 'expo-router';
export default function AssistantCategoriesScreen() {
  const {snapshot,mutate,busy}=useFinance();
  const [rows,setRows]=useState<CategorySuggestion[]>(()=>categorySuggestions(snapshot)),[offset,setOffset]=useState(0),[confirm,setConfirm]=useState(false),[saved,setSaved]=useState(0),[error,setError]=useState<string>(),[requestEpoch,setRequestEpoch]=useState(0);
  const eligible=snapshot.transactions.filter(row=>row.kind==='expense' && row.category==='other');
  const selected=rows.filter(row=>row.include && row.proposed!==row.current);
  const stale=rows.some(row=>{const current=snapshot.transactions.find(record=>record.id===row.id);return !current || categoryRevision(current)!==row.revision;});
  const revision=JSON.stringify([confirm,requestEpoch,rows.map(row=>[row.id,row.revision,row.proposed,row.include]),snapshot.transactions]);
  const choices: CloudChoice[]=rows.length && !stale && !confirm ? [{label:'Review cloud category request',operation:{kind:'categorize',rows:rows.map((row,index)=>({key:`r${index+1}`,merchant:row.merchant}))}}] : [];
  const load=(next:number) => {setOffset(next);setRows(categorySuggestions(snapshot,next));setConfirm(false);setSaved(0);setError(undefined);setRequestEpoch(prior=>prior+1);};
  const patch=(id:string,value:Partial<CategorySuggestion>)=>{setRows(prior=>prior.map(row=>row.id===id?{...row,...value}:row));setError(undefined);};
  return <FormScreen title="Review expense categories" busy={busy}>
    <AppText color={colors.secondary}>Review expenses currently in Other, five at a time. Suggestions use matching names in your history or simple name hints. Nothing starts selected. Only confirmed categories change; balances and payment details stay the same.</AppText>
    {saved>0 && <AppText color={colors.emerald} accessibilityLiveRegion="polite">{saved} {saved===1?'category':'categories'} updated.</AppText>}
    {stale && <>
      <FormError message="A record changed since this review started. Reload suggestions before continuing." />
      <AppButton label="Reload category suggestions" onPress={()=>load(0)} />
    </>}
    {confirm ? <>
      <AppText variant="title">Confirm {selected.length} category {selected.length===1?'change':'changes'}</AppText>
      {selected.map(row=>{
        const record=snapshot.transactions.find(item=>item.id===row.id);
        return <View key={row.id} style={styles.row}><AppText variant="label">{row.merchant}</AppText>
          {record && <AppText>{longFinancialDate(record.date)} · {formatMYR(record.amountSen)} · {snapshot.accounts.find(account=>account.id===record.accountId)?.name??'Account unavailable'}</AppText>}
          <AppText>{CATEGORY_LABELS[row.current]} → {CATEGORY_LABELS[row.proposed]}</AppText></View>;
      })}
      <AppText color={colors.secondary}>Category reports will reflect these changes. Amounts, dates, accounts, notes, import references and scheduled payment links are preserved.</AppText>
      <FormError message={error} />
      <AppButton label={busy?'Updating categories…':'Confirm category changes'} disabled={busy||stale||!selected.length} onPress={()=>{
        setError(undefined);const count=selected.length;
        void mutate(repository=>repository.applyCategoryChanges(selected.map(row=>({id:row.id,expectedRevision:row.revision,category:row.proposed})))).then(()=>{setRows([]);setConfirm(false);setSaved(count);setOffset(0);}).catch(failure=>setError(errorMessage(failure)));
      }} />
      <AppButton label="Back to category review" variant="secondary" disabled={busy} onPress={()=>{setConfirm(false);setRequestEpoch(prior=>prior+1);}} />
    </> : <>
      <AppText variant="label">{eligible.length} {eligible.length===1?'expense':'expenses'} in Other · {rows.length ? `showing ${offset+1}–${Math.min(offset+rows.length,eligible.length)}`:'no rows loaded'}</AppText>
      {!rows.length && <>
        <AppText color={colors.secondary}>{eligible.length?'Load the remaining expenses to review them.':'There are no expenses in Other to review. Existing categories stay as you set them.'}</AppText>
        {eligible.length>0 && <AppButton label="Load category suggestions" onPress={()=>load(0)} />}
      </>}
      {rows.map((row,index)=>{
        const record=snapshot.transactions.find(item=>item.id===row.id);
        return <View key={row.id} style={styles.row} testID={`category-row-${index+1}`}>
          <AppText variant="title">{row.merchant}</AppText>
          {record && <AppText color={colors.secondary}>{longFinancialDate(record.date)} · Expense · {formatMYR(record.amountSen)}</AppText>}
          <AppText color={colors.secondary}>Current: {CATEGORY_LABELS[row.current]}. {row.reason==='history'?'Suggested from consistent matching names in your history.':row.reason==='name_hint'?'Suggested from a name hint; check it.':row.reason==='cloud'?'AI suggestion from the merchant name; check it.':'The name is unclear or history conflicts. Choose a category yourself.'}</AppText>
          <ChoiceGroup label={`Category for row ${index+1}`} choices={CATEGORY_IDS.map(value=>({value,label:CATEGORY_LABELS[value]}))} value={row.proposed} disabled={stale||busy} onChange={value=>patch(row.id,{proposed:value as CategoryId,include:false})} />
          {!stale && !busy && row.proposed!==row.current ? <ScanCheck label={`Include category change for ${row.merchant}`} checked={row.include} onChange={()=>patch(row.id,{include:!row.include})} /> : <AppText variant="caption" color={colors.secondary}>{row.proposed===row.current?'Choose a different category to include a change.':'Reload suggestions before selecting changes.'}</AppText>}
        </View>;
      })}
      <FormError message={error} />
      {rows.length>0 && <>
        <AppText>{selected.length} changes selected. {selected.length===0?'Choose a category and include at least one change to continue.':''}</AppText>
        <AppButton label="Review selected category changes" disabled={!selected.length||stale||busy} onPress={()=>{setConfirm(true);setRequestEpoch(prior=>prior+1);}} />
        {(offset>0 || offset+5<eligible.length) && <AppText color={colors.secondary}>Moving pages clears this page’s unsaved selections.</AppText>}
        {offset>0 && <AppButton label="Previous five expenses" variant="secondary" onPress={()=>load(Math.max(0,offset-5))} />}
        {offset+5<eligible.length && <AppButton label="Next five expenses" variant="secondary" onPress={()=>load(offset+5)} />}
      </>}
    </>}
    <AssistantCloud choices={choices} revision={revision} suspended={confirm} onClear={()=>{
      const local=categorySuggestions(snapshot,offset);
      setRows(prior=>prior.map(row=>row.reason==='cloud'?local.find(item=>item.id===row.id)??{...row,proposed:row.current,reason:'unclear',include:false}:row));
    }} onResult={result=>{
      if(result.kind!=='categorize')return;
      setRows(prior=>prior.map((row,index)=>{const suggestion=result.rows.find(item=>item.key===`r${index+1}`);return suggestion?{...row,proposed:suggestion.category,reason:suggestion.reason==='unclear'?'unclear':'cloud',include:false}:row;}));
      setError(undefined);
    }} />
  </FormScreen>;
}
const styles=StyleSheet.create({row:{gap:spacing.md,paddingVertical:spacing.lg,borderBottomWidth:1,borderBottomColor:colors.line}});
