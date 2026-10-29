// Repeated local OCR on fictional fixtures in an isolated owned browser profile.
import {chromium} from 'playwright';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
const base=process.env.BAKIBUDDY_URL??'http://localhost:8082';
const output=path.resolve('test-results/phase8');await mkdir(output,{recursive:true});
const profile=await mkdtemp(path.join(output,'startup-probe-')),events=[],attempts=[];
const context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:390,height:844}}),page=await context.newPage();
page.setDefaultTimeout(20000);await page.clock.setFixedTime(new Date('2026-10-28T04:00:00Z'));
let stage='';
await page.exposeFunction('ocrStage',value=>{events.push(value);if(value.type==='progress')stage=value.status;});
await page.addInitScript(()=>addEventListener('message',event=>{try{const m=typeof event.data==='string'?JSON.parse(event.data):event.data;if(m?.type)void window.ocrStage({type:m.type,id:m.id,status:m.status,progress:m.progress});}catch{}}));
const button=name=>page.getByRole('button',{name,exact:true}).filter({visible:true});
try{
await page.goto(base+'/account/new',{waitUntil:'networkidle'});await page.getByLabel('Account name',{exact:true}).fill('Fictional startup probe');await page.getByLabel('Opening balance (RM)',{exact:true}).fill('1000');await button('Save account').click();await page.waitForURL(url=>!url.pathname.startsWith('/account/'));
await page.goto(base+'/scan-receipt',{waitUntil:'networkidle'});
for(let index=0;index<20;index++){
 const file=index%5===4?'scan-blank.png':index%5===2?'scan-fictional-activity.png':'scan-fictional-receipt.png';
 await context.setOffline(index%5===3);await page.getByRole('radio',{name:'Image layout: '+(file.includes('activity')?'TNG Activity list':'Receipt or payment detail'),exact:true}).filter({visible:true}).click();
 const chooser=page.waitForEvent('filechooser');await button('Choose image').click();await(await chooser).setFiles(path.resolve('tests/fixtures/'+file));stage='before reader';const start=Date.now();await button('Read image locally').click();
 try {await page.waitForFunction(()=>document.body.textContent.includes('candidate to check')||document.body.textContent.includes('candidates to check')||document.body.textContent.includes('No supported payment rows were found.')||document.body.textContent.includes('Reading timed out.')||document.body.textContent.includes('image could not be read'),{},{timeout:130000});}catch{}
 const body=await page.locator('body').innerText(),ok=body.includes('candidate to check')||body.includes('candidates to check')||body.includes('No supported payment rows were found.');
 const attempt={attempt:index+1,file,ok,lastStage:stage,ms:Date.now()-start};attempts.push(attempt);console.log(JSON.stringify(attempt));
 await writeFile(path.join(output,'ocr-startup-probe.json'),JSON.stringify({attempts,events},null,2));
 if(!ok){await page.screenshot({path:path.join(output,'ocr-startup-probe-failure.png')});break;}
 if(await button('Discard scan').count())await button('Discard scan').click();else await button('Discard selected image').click();
}
if(attempts.length!==20||attempts.some(attempt=>!attempt.ok))process.exitCode=1;
}finally{await context.close();if(!profile.startsWith(output+path.sep))throw Error('Unsafe owned probe profile');await rm(profile,{recursive:true,force:true});}
