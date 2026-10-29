import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { assistantRevision, buildAssistantAnswer } from '../assistant/engine';
import type { AssistantAnswer, AssistantPeriod } from '../assistant/types';
import { AssistantCloud, type CloudChoice } from '../components/AssistantCloud';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { FinancialCard } from '../components/FinancialCard';
import { ChoiceGroup, Field, FormError } from '../components/FormFields';
import { FormScreen } from '../components/FormScreen';
import { useFinance } from '../state/FinanceProvider';
import { colors, spacing } from '../theme/tokens';
import { errorMessage } from '../utils/validation';

export { ErrorBoundary } from 'expo-router';
const examples=['Can I afford RM50 today?','Why did I spend more this week?','How much should I save this month?','Am I spending too much on food?','How much money will I have next Friday?'];
export default function AssistantScreen() {
  const router=useRouter(),{snapshot,today}=useFinance();
  const [question,setQuestion]=useState(''),[period,setPeriod]=useState<AssistantPeriod>('month');
  const [answer,setAnswer]=useState<AssistantAnswer|null>(null),[error,setError]=useState<string>(),[highlights,setHighlights]=useState<string[]>([]),[showExamples,setShowExamples]=useState(false);
  const revision=assistantRevision(snapshot,today), fresh=answer?.revision===revision;
  const ask=(text=question) => {
    try { setAnswer(buildAssistantAnswer(snapshot,today,text,period));setError(undefined);setHighlights([]); }
    catch(failure) {setError(errorMessage(failure));}
  };
  const choices: CloudChoice[]=answer && fresh ? [
    {label:'Review cloud question interpretation',operation:{kind:'interpret',question:answer.question,period}},
    ...(answer.interpretation.intent!=='unsupported' && answer.facts.length ? [{label:'Review cloud insight selection',operation:{kind:'explain' as const,question:answer.question,facts:answer.facts}}] : []),
  ] : [];
  return <FormScreen title="Ask about your money">
    <AppText color={colors.secondary}>Start with an answer on this device. Figures come from your recorded activity and budget plan. Cloud help is optional and asks before sending any data.</AppText>
    <Field label="Your question" value={question} onChangeText={setQuestion} multiline maxLength={400} placeholder="Can I afford RM50 today?" hint="Up to 400 characters. Common spending, allowance, reserve and forecast questions work locally." />
    <ChoiceGroup label="Default spending period" value={period} choices={[{value:'month',label:'This month'},{value:'seven',label:'Last 7 days'},{value:'thirty',label:'Last 30 days'}]} onChange={value=>setPeriod(value as AssistantPeriod)} />
    <View style={styles.group}>
      <FormError message={error} />
      <AppButton label="Ask locally" icon="chatbubble-outline" onPress={()=>ask()} />
    </View>
    {answer && <FinancialCard style={styles.group} testID="assistant-answer">
      <AppText variant="title" accessibilityRole="header">{answer.title}</AppText>
      <AppText variant="caption" color={colors.secondary} selectable>Question: {answer.question}</AppText>
      <AppText variant="caption" color={colors.secondary}>Scope: {answer.scope}</AppText>
      {!fresh ? <>
        <FormError message="Your records or the financial date changed. Ask again for current figures." />
        <AppButton label="Refresh this answer" onPress={()=>ask(answer.question)} />
      </> : <>
        <AppText variant="label" color={colors.emerald}>Calculated on this device</AppText>
        {highlights.length>0 && <AppText color={colors.secondary}>Cloud-selected insights appear first. All verified facts and assumptions remain below.</AppText>}
        {[...answer.facts.filter(fact=>highlights.includes(fact.id)),...answer.facts.filter(fact=>!highlights.includes(fact.id))].map(fact=><AppText key={fact.id} selectable>{fact.text}</AppText>)}
        {answer.notes.map(note=><AppText key={note} variant="caption" color={colors.secondary}>{note}</AppText>)}
      </>}
    </FinancialCard>}
    <View style={styles.group}>
      <AppButton label={showExamples?'Hide example questions':'Try an example question'} variant="secondary" onPress={()=>setShowExamples(prior=>!prior)} />
      {showExamples && examples.map(example=><AppButton key={example} label={example} variant="secondary" onPress={()=>{setQuestion(example);ask(example);}} />)}
      <AppButton label="Review expense categories" variant="secondary" icon="pricetags-outline" onPress={()=>router.push('/assistant-categories')} />
    </View>
    <AssistantCloud choices={choices} revision={JSON.stringify([revision,answer?.question,question,period])} onClear={()=>{
      setHighlights([]);
      if(answer)try{setAnswer(buildAssistantAnswer(snapshot,today,answer.question,period));}catch(failure){setError(errorMessage(failure));}
    }} onResult={(result,operation)=>{
      if(result.kind==='interpret' && operation.kind==='interpret') {
        try {setAnswer(buildAssistantAnswer(snapshot,today,operation.question,period,result.interpretation));setHighlights([]);setError(undefined);}catch(failure){setError(errorMessage(failure));}
      } else if(result.kind==='explain')setHighlights(result.factIds);
    }} />
    <AppButton label="Clear this question and answer" variant="secondary" onPress={()=>{setQuestion('');setAnswer(null);setHighlights([]);setError(undefined);}} />
  </FormScreen>;
}
const styles=StyleSheet.create({group:{gap:spacing.lg}});
