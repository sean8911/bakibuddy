import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../scripts/ocr-runtime.js',import.meta.url),'utf8');
function runtime({recognitionError=false,imageError=false,imageWidth=400,imageHeight=600}={}) {
  const messages=[],revoked=[];let release,terminated,workers=0;
  const terminationStarted=new Promise(resolve=>terminated=resolve);
  const termination=new Promise(resolve=>release=resolve);
  const listeners=new Map();
  const context=vm.createContext({
    window:{},parent:{postMessage:text=>messages.push(JSON.parse(text))},addEventListener:(type,listener)=>listeners.set(type,listener),
    Uint8Array,atob:value=>Buffer.from(value,'base64').toString('binary'),Blob,
    URL:{createObjectURL:()=> 'blob:fictional-worker',revokeObjectURL:value=>revoked.push(value)},
    queueMicrotask,
    Image:class {
      width=imageWidth;height=imageHeight;
      set src(value){if(value)queueMicrotask(()=>imageError?this.onerror?.():this.onload?.());}
      async decode(){throw Error('Do not await hidden-reader decode');}
    },
    document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){}})})},
    OCR_WORKER:Buffer.from('fictional-worker').toString('base64'),OCR_LANGUAGE:'',
    Tesseract:{createWorker:async()=>{workers++;return {setParameters:async()=>{},recognize:async()=>{if(recognitionError)throw Error('fictional error');return {data:{text:'Fictional text',blocks:[]}};},terminate:async()=>{terminated();await termination;}};}},
  });
  vm.runInContext(source,context);
  return {context,messages,revoked,listeners,terminationStarted,release,get workers(){return workers;},read:context.window.__bbOcrRead};
}
const job=id=>({id,base64:'aGVsbG8=',mode:'receipt'});

test('OCR reports a result only after worker termination so result-driven unmount cannot interrupt cleanup',async t=>{
  const r=runtime();t.after(r.release);const input=job('one'),reading=r.read(input);await r.terminationStarted;
  assert.equal(r.messages.some(message=>message.type==='result'),false);
  r.release();await reading;assert.equal(r.messages.filter(message=>message.type==='result').length,1);assert.equal(input.base64,'');assert.deepEqual(r.revoked,['blob:fictional-worker']);
});
test('OCR failures report once after cleanup and never expose internal error details',async t=>{
  const r=runtime({recognitionError:true});t.after(r.release);const reading=r.read(job('one'));await r.terminationStarted;
  assert.equal(r.messages.some(message=>message.type==='error'),false);r.release();await reading;
  assert.deepEqual(r.messages.filter(message=>message.type==='error'),[{type:'error',id:'one',code:'READ'}]);assert.equal(JSON.stringify(r.messages).includes('fictional error'),false);
});
test('duplicate in-flight OCR jobs cannot spawn extra workers and a later job can start',async t=>{
  const r=runtime();t.after(r.release);const first=r.read(job('one'));await r.terminationStarted;await r.read(job('duplicate'));assert.equal(r.workers,1);r.release();await first;
  await r.read(job('two'));assert.equal(r.workers,2);assert.equal(r.messages.filter(message=>message.type==='result').length,2);
});
test('reader can repeat readiness on a trusted parent load request without accepting other message sources',()=>{
  const r=runtime(),listener=r.listeners.get('message'),parent=vm.runInContext('parent',r.context);
  assert.equal(r.messages.length,1);listener({source:{},data:{type:'ready-request'}});assert.equal(r.messages.length,1);
  listener({source:parent,data:{type:'ready-request'}});assert.equal(r.messages.length,2);assert.equal(r.messages[1].type,'ready');
});
test('image load/error events avoid a pending decode and reject corrupt input before worker startup',async()=>{
  const r=runtime({imageError:true});await r.read(job('bad'));
  assert.equal(r.workers,0);assert.deepEqual(r.messages.filter(message=>message.type==='error'),[{type:'error',id:'bad',code:'READ'}]);
});
test('image dimensions are checked before canvas allocation or OCR worker startup',async()=>{
  const r=runtime({imageWidth:10000,imageHeight:10000});await r.read(job('large'));
  assert.equal(r.workers,0);assert.deepEqual(r.messages.filter(message=>message.type==='error'),[{type:'error',id:'large',code:'LIMIT'}]);
});
