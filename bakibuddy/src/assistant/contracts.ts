import { CATEGORY_IDS } from '../types/finance.ts';
import { cleanQuestion, unsafeControls } from './question.ts';
import { ASSISTANT_INTENTS, ASSISTANT_LIMITS, type AssistantPeriod, type QuestionInterpretation, type VerifiedFact } from './types.ts';

export const CLOUD_CONSENT_VERSION = '2026-10-groq-v1';
export type CloudOperation =
  | { kind: 'interpret'; question: string; period: AssistantPeriod }
  | { kind: 'explain'; question: string; facts: VerifiedFact[] }
  | { kind: 'categorize'; rows: { key: string; merchant: string }[] };
export type CloudResult =
  | { kind: 'interpret'; interpretation: QuestionInterpretation }
  | { kind: 'explain'; factIds: string[] }
  | { kind: 'categorize'; rows: { key: string; category: typeof CATEGORY_IDS[number]; reason: 'merchant_name' | 'unclear' }[] };
export const isObject = (value: unknown): value is Record<string,unknown> => typeof value==='object'&&value!==null&&!Array.isArray(value);
function keys(value: Record<string,unknown>, expected: string[]) { if(Object.keys(value).length!==expected.length||Object.keys(value).some(key=>!expected.includes(key)))throw new Error('Unexpected data fields'); }
function text(value: unknown, max: number) { if(typeof value!=='string'||!value.trim()||value.length>max||unsafeControls(value))throw new Error('Invalid text');return value; }
function member<T extends string>(value: unknown, allowed: readonly T[]): T { if(typeof value!=='string'||!allowed.includes(value as T))throw new Error('Invalid choice');return value as T; }
const periods = ['month','seven','thirty'] as const;
const horizons = ['next_friday','seven_days','cycle_end'] as const;
export function validateCloudOperation(value: unknown): CloudOperation {
  if(!isObject(value))throw new Error('Invalid cloud operation');
  if(value.kind==='interpret') { keys(value,['kind','question','period']);return {kind:'interpret',question:cleanQuestion(text(value.question,ASSISTANT_LIMITS.question)),period:member(value.period,periods)}; }
  if(value.kind==='explain') {
    keys(value,['kind','question','facts']);if(!Array.isArray(value.facts)||!value.facts.length||value.facts.length>ASSISTANT_LIMITS.facts)throw new Error('Invalid fact count');
    const facts=value.facts.map((fact: unknown)=>{if(!isObject(fact))throw new Error('Invalid fact');keys(fact,['id','text']);const id=text(fact.id,64);if(!/^[a-z][a-z0-9_.-]*$/.test(id))throw new Error('Invalid fact identifier');return {id,text:text(fact.text,ASSISTANT_LIMITS.factText)};});
    if(new Set(facts.map(fact=>fact.id)).size!==facts.length)throw new Error('Repeated fact identifiers');
    return {kind:'explain',question:cleanQuestion(text(value.question,ASSISTANT_LIMITS.question)),facts};
  }
  if(value.kind==='categorize') {
    keys(value,['kind','rows']);if(!Array.isArray(value.rows)||!value.rows.length||value.rows.length>ASSISTANT_LIMITS.categoryRows)throw new Error('Invalid category row count');
    const rows=value.rows.map((row: unknown)=>{if(!isObject(row))throw new Error('Invalid row');keys(row,['key','merchant']);const key=text(row.key,16);if(!/^r[1-5]$/.test(key))throw new Error('Invalid row key');return {key,merchant:text(row.merchant,80)};});
    if(new Set(rows.map(row=>row.key)).size!==rows.length)throw new Error('Repeated row keys');return {kind:'categorize',rows};
  }
  throw new Error('Unknown cloud operation');
}
export function validateCloudResult(value: unknown, operation: CloudOperation): CloudResult {
  if(!isObject(value))throw new Error('Invalid AI response');
  if(operation.kind==='interpret') {
    keys(value,['intent','period','category','horizon']);
    return {kind:'interpret',interpretation:{intent:member(value.intent,ASSISTANT_INTENTS),period:member(value.period,periods),category:value.category===null?null:member(value.category,CATEGORY_IDS),horizon:member(value.horizon,horizons)}};
  }
  if(operation.kind==='explain') {
    keys(value,['factIds']);if(!Array.isArray(value.factIds)||!value.factIds.length||value.factIds.length>operation.facts.length)throw new Error('Invalid fact selection');
    const ids=value.factIds.map(id=>member(id,operation.facts.map(fact=>fact.id)));if(new Set(ids).size!==ids.length)throw new Error('Repeated selected facts');return {kind:'explain',factIds:ids};
  }
  keys(value,['rows']);if(!Array.isArray(value.rows)||value.rows.length!==operation.rows.length)throw new Error('Missing category suggestions');
  const rows=value.rows.map((row: unknown)=>{if(!isObject(row))throw new Error('Invalid category suggestion');keys(row,['key','category','reason']);const category=member(row.category,CATEGORY_IDS),reason=member(row.reason,['merchant_name','unclear']);if(reason==='unclear'&&category!=='other')throw new Error('An unclear suggestion must remain Other');return {key:member(row.key,operation.rows.map(item=>item.key)),category,reason};});
  if(new Set(rows.map(row=>row.key)).size!==rows.length)throw new Error('Repeated category suggestions');return {kind:'categorize',rows};
}
export function outputSchema(operation: CloudOperation): Record<string,unknown> {
  const root=(properties: Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
  if(operation.kind==='interpret')return root({intent:{type:'string',enum:ASSISTANT_INTENTS},period:{type:'string',enum:periods},category:{type:['string','null'],enum:[...CATEGORY_IDS,null]},horizon:{type:'string',enum:horizons}});
  if(operation.kind==='explain')return root({factIds:{type:'array',items:{type:'string',enum:operation.facts.map(fact=>fact.id)},minItems:1,maxItems:operation.facts.length}});
  return root({rows:{type:'array',minItems:operation.rows.length,maxItems:operation.rows.length,items:root({key:{type:'string',enum:operation.rows.map(row=>row.key)},category:{type:'string',enum:CATEGORY_IDS},reason:{type:'string',enum:['merchant_name','unclear']}})}});
}
export function serverUrl(raw: string): string {
  let url: URL;try{url=new URL(raw.trim());}catch{throw new Error('Enter the companion server URL.');}
  if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Use only the server origin, without credentials, paths or query parameters.');
  const host=url.hostname.toLowerCase();const parts=host.split('.').map(Number);
  const ipv4=parts.length===4&&parts.every(part=>Number.isInteger(part)&&part>=0&&part<=255);
  const privateHost=host==='localhost'||host==='[::1]'||(ipv4&&(parts[0]===127||parts[0]===10||(parts[0]===192&&parts[1]===168)||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)));
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&privateHost))throw new Error('Use HTTPS, or a private HTTP address for local development.');
  return url.origin;
}
