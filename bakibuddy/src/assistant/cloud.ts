import { CLOUD_CONSENT_VERSION, serverUrl, validateCloudOperation, validateCloudResult, type CloudOperation, type CloudResult, isObject } from './contracts.ts';
import { ASSISTANT_LIMITS } from './types.ts';

export class CloudError extends Error { readonly code: string; constructor(message: string, code='CLOUD'){super(message);this.name='CloudError';this.code=code;} }
export async function requestCloud(operation: CloudOperation, settings: {url: string; token: string}, approved: boolean, signal?: AbortSignal, fetcher: typeof fetch=fetch): Promise<CloudResult> {
  if(!approved)throw new CloudError('Cloud consent is required. Nothing was sent.','CONSENT');
  const checked=validateCloudOperation(operation), url=serverUrl(settings.url), token=settings.token.trim();
  if(token.startsWith('sk-')||token.startsWith('gsk_'))throw new CloudError('Keep provider API keys on the server. Enter the separate server access token.','CONFIG');
  if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))throw new CloudError('Enter the server access token from your local server configuration.','CONFIG');
  const controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
  const timer=setTimeout(abort,ASSISTANT_LIMITS.timeoutMs);
  try {
    const response=await fetcher(`${url}/v1/assistant`,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({consent:CLOUD_CONSENT_VERSION,operation:checked}),signal:controller.signal});
    if(!response.ok) {
      const messages: Record<number,string>={401:'The server access token was not accepted.',403:'The server did not accept this connection.',429:'The cloud request limit was reached. Keep using local answers and try later.',503:'Cloud AI is not configured or is temporarily unavailable. Local answers still work.'};
      throw new CloudError(messages[response.status]??'Cloud AI could not complete this request. Keep the local result and try later.',String(response.status));
    }
    if(Number(response.headers.get('content-length'))>ASSISTANT_LIMITS.responseBytes)throw new CloudError('The cloud response was too large. The local result is unchanged.','INVALID');
    const raw=await response.text();if(raw.length>ASSISTANT_LIMITS.responseBytes)throw new CloudError('The cloud response was too large. The local result is unchanged.','INVALID');
    let envelope: unknown;try{envelope=JSON.parse(raw);}catch{throw new CloudError('The cloud response was invalid. The local result is unchanged.','INVALID');}
    if(!isObject(envelope)||!('result' in envelope))throw new CloudError('The cloud response was invalid. The local result is unchanged.','INVALID');
    return validateCloudResult(envelope.result,checked);
  } catch(error) {
    if(error instanceof CloudError)throw error;
    if(controller.signal.aborted)throw new CloudError(signal?.aborted?'Cloud request cancelled. The local result is unchanged.':'Cloud AI timed out. The local result is unchanged.','ABORT');
    throw new CloudError('Cloud AI could not be reached or returned unusable data. Keep using the local result.','NETWORK');
  } finally { clearTimeout(timer);signal?.removeEventListener('abort',abort); }
}
