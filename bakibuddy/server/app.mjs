import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CLOUD_CONSENT_VERSION, validateCloudOperation } from '../src/assistant/contracts.ts';
import { ASSISTANT_LIMITS } from '../src/assistant/types.ts';
import { askProvider, GROQ_MODEL } from './provider.mjs';

const fingerprint=value=>createHash('sha256').update(value).digest();
const defaultOrigins=['http://localhost:8082','http://127.0.0.1:8082','http://localhost:8081','http://127.0.0.1:8081'];
export function createAssistantServer({apiKey='',token='',model=GROQ_MODEL,fetcher=fetch,origins=defaultOrigins,now=Date.now,timeoutMs=22000,hourLimit=30,dayLimit=100,cacheMs=120000}={}) {
  if(token && (!/^[A-Za-z0-9_-]{32,128}$/.test(token)||token.startsWith('sk-')||token.startsWith('gsk_')))throw new Error('Configure a separate random server access token of 32–128 characters.');
  if(!['openai/gpt-oss-20b','openai/gpt-oss-120b'].includes(model))throw new Error('Choose a supported Groq strict-output model: openai/gpt-oss-20b or openai/gpt-oss-120b.');
  const cache=new Map();let active=false,hour=Math.floor(now()/3600000),day=Math.floor(now()/86400000),hourCount=0,dayCount=0;
  const server=createServer(async(req,res)=>{
    const origin=req.headers.origin;
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
    const reply=(status,body)=>{if(!res.destroyed&&!res.writableEnded){res.writeHead(status);res.end(JSON.stringify(body));}};
    if(origin && !origins.includes(origin)){reply(403,{error:'ORIGIN'});return;}
    if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
    if(req.method==='OPTIONS') {res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, GET, OPTIONS');res.writeHead(204).end();return;}
    const supplied=req.headers.authorization??'';
    if(!token||!timingSafeEqual(fingerprint(supplied),fingerprint(`Bearer ${token}`))){reply(401,{error:'AUTH'});return;}
    if(req.url==='/health'&&req.method==='GET'){reply(200,{ready:Boolean(apiKey),provider:'Groq',model});return;}
    if(req.url!=='/v1/assistant'||req.method!=='POST'){reply(404,{error:'NOT_FOUND'});return;}
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??'')){reply(415,{error:'CONTENT_TYPE'});return;}
    let timer,controller;
    try {
      const chunks=[];let bytes=0;
      const readTimer=setTimeout(()=>req.destroy(),5000);
      try {for await(const chunk of req){bytes+=chunk.length;if(bytes>ASSISTANT_LIMITS.requestBytes){reply(413,{error:'BODY_LIMIT'});return;}chunks.push(chunk);}}finally{clearTimeout(readTimer);}
      let envelope,operation;
      try {envelope=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||Object.keys(envelope).length!==2||envelope.consent!==CLOUD_CONSENT_VERSION||!('operation' in envelope))throw Error();operation=validateCloudOperation(envelope.operation);}catch{reply(400,{error:'INVALID_OR_UNAPPROVED'});return;}
      if(!apiKey){reply(503,{error:'NOT_CONFIGURED'});return;}
      const key=fingerprint(JSON.stringify(operation)).toString('hex');const prior=cache.get(key);
      if(prior && prior.expires>now()){reply(200,{result:prior.result,cached:true});return;}
      const currentHour=Math.floor(now()/3600000),currentDay=Math.floor(now()/86400000);if(currentHour!==hour){hour=currentHour;hourCount=0;}if(currentDay!==day){day=currentDay;dayCount=0;}
      if(active||hourCount>=hourLimit||dayCount>=dayLimit){res.setHeader('Retry-After','60');reply(429,{error:'LOCAL_LIMIT'});return;}
      hourCount++;dayCount++;active=true;
      controller=new AbortController();timer=setTimeout(()=>controller.abort(),timeoutMs);
      const close=()=>{if(!res.writableEnded)controller.abort();};res.once('close',close);
      try {
        const result=await askProvider(operation,{apiKey,model,fetcher,signal:controller.signal});
        if(controller.signal.aborted)throw Error('ABORT');
        for(const [cachedKey,value] of cache)if(value.expires<=now())cache.delete(cachedKey);
        if(cache.size>=50)cache.delete(cache.keys().next().value);
        cache.set(key,{result,expires:now()+cacheMs});reply(200,{result,cached:false});
      }finally{res.removeListener('close',close);active=false;}
    }catch(error) {
      if(error?.code==='PROVIDER_LIMIT'){res.setHeader('Retry-After','60');reply(429,{error:'PROVIDER_LIMIT'});}
      else reply(controller?.signal.aborted?504:502,{error:controller?.signal.aborted?'TIMEOUT':'PROVIDER_UNAVAILABLE'});
    }
    finally {clearTimeout(timer);}
  });
  server.headersTimeout=6000;server.requestTimeout=10000;server.keepAliveTimeout=2000;
  return server;
}
