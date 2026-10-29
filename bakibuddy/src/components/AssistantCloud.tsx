import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, StyleSheet, View } from 'react-native';
import { requestCloud } from '../assistant/cloud';
import { serverUrl, type CloudOperation, type CloudResult } from '../assistant/contracts';
import { colors, spacing } from '../theme/tokens';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { ChoiceGroup, Field, FormError } from './FormFields';

export interface CloudChoice { label: string; operation: CloudOperation }
export function AssistantCloud({ choices, revision, onResult, onClear, suspended=false }: {
  choices: CloudChoice[]; revision: string;
  onResult: (result: CloudResult, operation: CloudOperation) => void;
  onClear: () => void;
  suspended?: boolean;
}) {
  const [mode, setMode] = useState('local');
  const [url, setUrl] = useState('http://localhost:8787'), [token, setToken] = useState('');
  const [settings, setSettings] = useState<{url: string; token: string} | null>(null);
  const [prepared, setPending] = useState<{operation: CloudOperation; revision: string} | null>(null);
  const [error, setError] = useState<string>(), [status, setStatus] = useState(''), [sending, setSending] = useState(false), [exact, setExact] = useState(false);
  const active = useRef<AbortController | null>(null), mounted = useRef(true), currentRevision = useRef(revision);
  const clearResult = useRef(onClear);
  useEffect(() => { clearResult.current=onClear; }, [onClear]);
  const pending=prepared?.revision===revision?prepared:null;
  useEffect(() => {
    if(currentRevision.current!==revision)active.current?.abort();
    currentRevision.current = revision;
  }, [revision]);
  useFocusEffect(useCallback(() => () => {
    // A pushed route can leave this component mounted in the navigation stack.
    active.current?.abort(); active.current = null;
    setToken(''); setSettings(null); setPending(null); setSending(false); setMode('local'); setExact(false); setError(undefined); setStatus('');
    clearResult.current();
  }, []));
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background') {
        active.current?.abort(); active.current = null;
        setToken(''); setSettings(null); setPending(null); setSending(false); setMode('local'); setExact(false);
        setStatus('Cloud connection cleared when the app left the foreground. Local answers still work.');
        clearResult.current();
      }
    });
    return () => { mounted.current = false; active.current?.abort(); active.current = null; listener.remove(); };
  }, []);
  const clear = () => {
    active.current?.abort(); active.current = null; setSending(false); setPending(null); setToken(''); setSettings(null); setMode('local'); setExact(false); setError(undefined);
    setStatus('Cloud connection cleared. Nothing else will be sent.');
    clearResult.current();
  };
  const send = async () => {
    if (!pending || !settings || sending) return;
    if (pending.revision !== revision) { setPending(null); setError('Your records or question changed. Prepare a new request and review its data.'); return; }
    const controller = new AbortController(); active.current = controller; setSending(true); setError(undefined); setStatus('');
    try {
      const result = await requestCloud(pending.operation, settings, true, controller.signal);
      if (!mounted.current || active.current !== controller) return;
      if (currentRevision.current !== pending.revision) { setError('Your records or question changed. The cloud result was discarded. Prepare a new request.'); return; }
      onResult(result, pending.operation); setStatus('Cloud result checked. Financial figures still come from calculations on this device.');
    } catch (failure) {
      if (mounted.current && active.current === controller) setError(failure instanceof Error ? failure.message : 'Cloud AI could not finish. Local answers still work.');
    } finally {
      if (mounted.current && active.current === controller) { active.current = null; setSending(false); setPending(null); setExact(false); }
    }
  };
  if(suspended)return <View style={styles.section}><AppText color={colors.secondary}>Cloud suggestions are paused during confirmation. Return to category review to prepare a new request.</AppText></View>;
  return <View style={styles.section} testID="assistant-cloud">
    <AppText variant="title" accessibilityRole="header">Optional cloud help</AppText>
    <AppText color={colors.secondary}>Groq can interpret a question, pick relevant verified insights or suggest categories. Local answers work without it. Each request needs your approval.</AppText>
    <ChoiceGroup label="Assistant connection" value={mode} choices={[{value:'local',label:'On this device'},{value:'cloud',label:'Set up cloud'}]} onChange={value => value === 'local' ? clear() : setMode('cloud')} disabled={sending} />
    {mode === 'cloud' && <>
      {!settings ? <>
        <AppText color={colors.secondary}>Run the BakiBuddy companion server on your computer. Keep its Groq API key there. Enter the separate server access token below; it is kept only while this screen is open.</AppText>
        <Field label="Companion server URL" value={url} onChangeText={setUrl} keyboardType="url" maxLength={200} hint="Use your computer’s private IP for a phone, or HTTPS for a remote server. localhost refers to this device." />
        <Field label="Server access token" value={token} onChangeText={setToken} secureTextEntry maxLength={128} hint="Use AI_SERVER_TOKEN from server/.env. Never enter a Groq or other provider API key here." />
        <AppButton label="Use connection for this session" variant="secondary" onPress={() => {
          try {
            const checkedUrl=serverUrl(url), checkedToken=token.trim();
            if(checkedToken.startsWith('sk-')||checkedToken.startsWith('gsk_'))throw new Error('Keep provider API keys on the server. Enter AI_SERVER_TOKEN instead.');
            if(!/^[A-Za-z0-9_-]{32,128}$/.test(checkedToken))throw new Error('Enter the separate server access token from server/.env (32–128 letters, digits, hyphens or underscores).');
            setSettings({url:checkedUrl,token:checkedToken}); setToken(''); setError(undefined); setStatus('Connection details ready. No request has been sent.');
          } catch(failure) { setError(failure instanceof Error ? failure.message : 'Check the connection details.'); }
        }} />
      </> : <>
        <AppText>Destination: {settings.url} → Groq</AppText>
        <AppText variant="caption" color={colors.secondary}>Clearing this connection also clears unapplied cloud suggestions. Leaving this screen or backgrounding the app clears the connection.</AppText>
        {settings.url.startsWith('http:') && <AppText color={colors.amber}>This development connection uses unencrypted HTTP on your local network. Use only a trusted private network; use HTTPS for a remote server.</AppText>}
        {pending ? <View style={styles.group} testID="cloud-consent">
          <AppText variant="title">Review this request</AppText>
          {pending.operation.kind === 'categorize' ? <>
            <AppText>Only these merchant names and temporary row labels will be sent:</AppText>
            {pending.operation.rows.map(row => <AppText key={row.key} selectable>{row.key}: {row.merchant}</AppText>)}
            <AppText color={colors.secondary}>Amounts, dates, accounts, notes and images stay on this device.</AppText>
          </> : <>
            <AppText selectable>Question: {pending.operation.question}</AppText>
            {pending.operation.kind === 'interpret' ? <AppText>Selected period: {pending.operation.period}. No financial records will be sent.</AppText> : <>
              <AppText>These verified facts will also be sent:</AppText>
              {pending.operation.facts.map(fact => <AppText key={fact.id} selectable>{fact.text}</AppText>)}
            </>}
          </>}
          <AppText color={colors.secondary}>Your companion server forwards this data to Groq. Stay on Groq’s Free Plan for free quotas; paid plans may charge. Groq normally does not retain inference content, but may retain reliability or abuse logs for up to 30 days, or longer if legally required. Data Controls can change this. {sending?'Request sent. Cancellation stops waiting and attempts to stop the request. Provider processing and any charges may continue.':'Cancel sends nothing.'}</AppText>
          <AppButton label="Read Groq data policy" variant="secondary" onPress={() => { void Linking.openURL('https://console.groq.com/docs/your-data').catch(() => setError('The policy could not be opened. Try the link in the project README.')); }} />
          <AppButton label={exact ? 'Hide exact request fields' : 'Show exact request fields'} variant="secondary" disabled={sending} onPress={() => setExact(prior => !prior)} />
          {exact && <AppText selectable variant="caption">{JSON.stringify(pending.operation,null,2)}</AppText>}
          {pending.revision !== revision && <FormError message="Your records or question changed. Cancel and prepare a new request." />}
          {sending ? <>
            <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Waiting for cloud AI"><ActivityIndicator color={colors.emerald} /><AppText>Waiting for cloud AI…</AppText></View>
            <AppButton label="Cancel cloud request" variant="secondary" onPress={() => active.current?.abort()} />
          </> : <>
            <AppButton label="Send this request" disabled={pending.revision !== revision} onPress={() => { void send(); }} />
            <AppButton label="Cancel without sending" variant="secondary" onPress={() => { setPending(null); setExact(false); setError(undefined); setStatus('Cancelled. Nothing was sent.'); }} />
          </>}
        </View> : <>
          {choices.map(choice => <AppButton key={choice.label} label={choice.label} variant="secondary" onPress={() => { setPending({operation:choice.operation,revision}); setExact(false); setError(undefined); setStatus(''); }} />)}
          {!choices.length && <AppText color={colors.secondary}>Ask a question locally or load category suggestions first.</AppText>}
        </>}
        <AppButton label="Clear cloud connection" variant="secondary" onPress={clear} />
      </>}
    </>}
    <FormError message={error} />
    {!!status && <AppText color={colors.secondary} accessibilityLiveRegion="polite">{status}</AppText>}
  </View>;
}
const styles=StyleSheet.create({section:{gap:spacing.lg,paddingTop:spacing.xl,borderTopWidth:1,borderTopColor:colors.line},group:{gap:spacing.lg},progress:{flexDirection:'row',flexWrap:'wrap',gap:12,alignItems:'center'}});
