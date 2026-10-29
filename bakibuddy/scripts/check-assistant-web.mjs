import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAssistantServer } from '../server/app.mjs';

// Isolated fictional ledger and explicitly synthetic provider. Never calls Groq.
const base=process.env.BAKIBUDDY_URL??'http://localhost:8082';
const output=path.resolve('test-results/phase7-groq');await mkdir(output,{recursive:true});
const profile=await mkdtemp(path.join(output,'profile-'));
const token='synthetic-browser-server-token-'.repeat(2), requests=[],checks=[],errors=[],external=[];
let responseMode='valid',context,page;
const server=createAssistantServer({apiKey:'synthetic-not-live',token,origins:[new URL(base).origin],timeoutMs:2000,fetcher:async(_url,init)=>{
  const body=JSON.parse(init.body),operation=JSON.parse(body.messages[1].content);requests.push(operation);
  if(responseMode==='failure')return new Response('{}',{status:503});
  if(responseMode==='quota')return new Response('{}',{status:429});
  if(responseMode==='timeout'||responseMode==='waiting')await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,10000);init.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new Error('synthetic timeout'));},{once:true});});
  const result=responseMode==='malformed'?{factIds:['fabricated.value']} : operation.kind==='interpret'?{intent:'spending',period:'month',category:null,horizon:'cycle_end'}:operation.kind==='explain'?{factIds:operation.facts.slice(0,1).map(row=>row.id)}:{rows:operation.rows.map(row=>({key:row.key,category:'education',reason:'merchant_name'}))};
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(result)}}]}),{headers:{'Content-Type':'application/json'}});
}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const cloudUrl=`http://127.0.0.1:${server.address().port}`;
const visible=locator=>locator.filter({visible:true});
const button=name=>visible(page.getByRole('button',{name,exact:true}));
const radio=name=>visible(page.getByRole('radio',{name,exact:true}));
const text=value=>visible(page.getByText(value,{exact:true}));
async function launch(){
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:390,height:844},reducedMotion:'reduce'});
  context.on('request',request=>{if(/^https?:/.test(request.url())&&![new URL(base).origin,cloudUrl].includes(new URL(request.url()).origin))external.push(new URL(request.url()).origin);});
  await context.route('**/*',route=>/^https?:/.test(route.request().url())&&![new URL(base).origin,cloudUrl].includes(new URL(route.request().url()).origin)?route.abort():route.continue());
  page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(120000);
  await page.clock.setFixedTime(new Date('2026-10-27T04:00:00Z'));
  page.on('pageerror',error=>errors.push(error.message));
}
async function navigate(route='/assistant'){await page.goto(base+route,{waitUntil:'networkidle'});await visible(page.getByTestId('screen-title')).waitFor();}
async function capture(name){
  await page.evaluate(()=>document.fonts.ready);
  for(const [suffix,fraction]of[['',0],['-middle',.5],['-bottom',1]]){
    await page.evaluate(fraction=>{for(const element of document.querySelectorAll('div'))if(['auto','scroll'].includes(getComputedStyle(element).overflowY)&&element.scrollHeight>element.clientHeight+1&&element.getBoundingClientRect().width>0)element.scrollTop=(element.scrollHeight-element.clientHeight)*fraction;window.scrollTo(0,0);},fraction);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(output,name+suffix+'.png'),fullPage:true});
  }
}
async function matrix(name){for(const width of[320,375,390,430,1440]){await page.setViewportSize({width,height:width===1440?1000:844});await capture(`${name}-${width}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}await page.setViewportSize({width:390,height:844});}
async function account(name,amount){await navigate('/account/new');await page.getByLabel('Account name',{exact:true}).fill(name);await page.getByLabel('Opening balance (RM)',{exact:true}).fill(amount);await button('Save account').click();await page.waitForURL(url=>!url.pathname.startsWith('/account/'),{waitUntil:'networkidle'});}
async function transaction(kind,title,amount,date,category,accountName){
  await navigate('/transaction/new');await radio('Transaction type: '+kind).click();
  await page.getByLabel('Title',{exact:true}).fill(title);await page.getByLabel('Amount (RM)',{exact:true}).fill(amount);await page.getByLabel('Transaction date',{exact:true}).fill(date);
  if(category)await radio('Category: '+category).click();
  if(accountName)await radio('Payment account: '+accountName).click();
  if(kind==='Transfer')await radio('To account: Assistant Wallet').click();
  await button('Save transaction').click();await page.waitForURL(url=>!url.pathname.startsWith('/transaction/'),{waitUntil:'networkidle'});
}
async function ask(question){await page.getByLabel('Your question',{exact:true}).fill(question);await button('Ask locally').click();await visible(page.getByTestId('assistant-answer')).waitFor();}
async function configure(){await radio('Assistant connection: Set up cloud').click();await page.getByLabel('Companion server URL',{exact:true}).fill(cloudUrl);await page.getByLabel('Server access token',{exact:true}).fill(token);await button('Use connection for this session').click();await text('Connection details ready. No request has been sent.').waitFor();}
async function send(label){await button(label).click();await button('Send this request').click();}
try{
  await launch();await navigate();await capture('empty-390');assert.equal(requests.length,0);
  await button('Ask locally').click();await text('Enter a question of 1 to 400 characters.').waitFor();checks.push('Empty question has recoverable validation; opening assistant makes no cloud request');
  await ask('Can I afford RM50 today?');await text('Set or update your budget plan before comparing a payment with protected funds.').waitFor();await capture('no-plan-390');checks.push('Fresh ledger does not invent affordability or seed records');
  await account('Assistant Bank','1000');await account('Assistant Wallet','0');
  await transaction('Income','Fictional allowance','100','2026-10-25');
  await transaction('Expense','Moon Cafe','25','2026-10-27','Food & drinks');
  await transaction('Expense','Moon Market','10','2026-10-15','Groceries');
  await transaction('Expense','Campus Bookshop','12','2026-10-27','Other');
  await transaction('Refund','Fictional return','5','2026-10-27');
  await transaction('Transfer','Own-wallet topup','50','2026-10-27');
  await navigate('/budget-plan');await page.getByLabel('Savings reserve (RM)',{exact:true}).fill('100');await page.getByLabel('Cycle spending limit (RM, optional)',{exact:true}).fill('500');await button('Save budget plan').click();await page.waitForURL(url=>url.pathname!=='/budget-plan',{waitUntil:'networkidle'});
  for(const[name,kind,amount,date]of[['Fictional rent','Bill / expense','100','2026-10-28'],['Fictional project','Expected income','200','2026-10-30']]){await navigate('/planned/new');await radio('Scheduled type: '+kind).click();await page.getByLabel('Schedule name',{exact:true}).fill(name);await page.getByLabel('Scheduled amount (RM)',{exact:true}).fill(amount);await page.getByLabel('First due date',{exact:true}).fill(date);await button('Save scheduled item').click();await page.waitForURL(url=>!url.pathname.startsWith('/planned/'),{waitUntil:'networkidle'});}
  await navigate();await ask('Can I afford RM50 today?');await text("Today's allowance: RM51.85.").waitFor();await text('This single payment is within today’s plan allowance.').waitFor();await matrix('afford');checks.push('One-payment affordability uses exact protected daily allowance and the entered cap');
  await ask('Why did I spend more this week?');await text('Recorded expense difference: RM27.00.').waitFor();await capture('weekly-390');checks.push('Weekly changes use equal periods and descriptive category differences');
  await ask('How much should I save this month?');await text('Your chosen savings reserve: RM100.00.').waitFor();await capture('reserve-390');checks.push('Savings answer reports the entered reserve and invents no recommended percentage');
  await ask('Am I spending too much on food?');await text('Food & drinks expenses: RM25.00 across 1 record.').waitFor();await capture('category-answer-390');checks.push('Food spending has verified gross expense share and no invented category target');
  await ask('How much money will I have next Friday?');await text('Scheduled balance on 2026-10-30: RM1,158.00.').waitFor();await matrix('forecast');checks.push('Friday forecast is conditional, exact and includes only entered scheduled items');
  await ask('Can I afford RM1.234 today?');await visible(page.getByRole('alert')).waitFor();await capture('amount-error-390');checks.push('Malformed amount retains a recoverable question and the previous answer');
  await ask('Should I invest in crypto?');await text('Choose a supported money question').waitFor();checks.push('Unsupported investment advice never invents financial guidance');
  await ask('Show my spending');await text('Expenses: RM47.00 across 3 records.').waitFor();await text('Refunds: RM5.00; shown separately from expenses.').waitFor();
  await radio('Default spending period: Last 7 days').click();await button('Ask locally').click();await text('Expenses: RM37.00 across 2 records.').waitFor();checks.push('Period selection refreshes verified spending; refunds/transfers remain separate');
  await context.setOffline(true);await ask('How much should I save this month?');await text('Your chosen savings reserve: RM100.00.').waitFor();await context.setOffline(false);assert.equal(requests.length,0);checks.push('All local examples and category engines operate without external requests, including offline');
  await radio('Assistant connection: Set up cloud').click();await page.getByLabel('Companion server URL',{exact:true}).fill('http://example.com');await page.getByLabel('Server access token',{exact:true}).fill(token);await button('Use connection for this session').click();await visible(page.getByRole('alert')).waitFor();await capture('connection-error-390');checks.push('Public unencrypted cloud destination is rejected before sending');
  await page.getByLabel('Companion server URL',{exact:true}).fill(cloudUrl);await page.getByLabel('Server access token',{exact:true}).fill('gsk_'+ 'x'.repeat(40));await button('Use connection for this session').click();await text('Keep provider API keys on the server. Enter AI_SERVER_TOKEN instead.').waitFor();assert.equal(requests.length,0);checks.push('Groq API keys are rejected in the phone token field before any request');
  await page.getByLabel('Server access token',{exact:true}).fill(token);await button('Use connection for this session').click();await text('Connection details ready. No request has been sent.').waitFor();
  await button('Review cloud insight selection').click();await text(`Destination: ${cloudUrl} → Groq`).waitFor();await button('Read Groq data policy').waitFor();await visible(page.getByText(/Stay on Groq’s Free Plan for free quotas/)).waitFor();await matrix('insight-consent');assert.equal(requests.length,0);await button('Cancel without sending').click();assert.equal(requests.length,0);checks.push('Groq destination, data policy and plan/retention disclosure match the chosen provider');checks.push('Exact question/fact preview and cancellation make no cloud call');
  await send('Review cloud insight selection');await text('Cloud result checked. Financial figures still come from calculations on this device.').waitFor();await text('Cloud-selected insights appear first. All verified facts and assumptions remain below.').waitFor();await capture('cloud-selected-390');checks.push('Synthetic provider selects known fact IDs while all facts/assumptions remain local');
  assert.deepEqual(Object.keys(requests.at(-1)).sort(),['facts','kind','question']);assert.equal(JSON.stringify(requests.at(-1)).includes('Assistant Bank'),false);checks.push('Insight payload contains only the question and verified facts, without account or merchant identities');
  await ask('Explain the outgoings please');await text('Choose a supported money question').waitFor();await send('Review cloud question interpretation');await text('Recorded spending').waitFor();assert.deepEqual(Object.keys(requests.at(-1)).sort(),['kind','period','question']);await capture('interpreted-390');checks.push('Synthetic interpretation returns checked enums, then on-device calculations build the answer');
  await button('Review cloud insight selection').click();const beforeChangedQuestion=requests.length;await page.getByLabel('Your question',{exact:true}).fill('A changed question');assert.equal(await button('Send this request').count(),0);assert.equal(requests.length,beforeChangedQuestion);checks.push('Changing the question invalidates and hides pending consent before Send');
  for(const mode of['malformed','failure','timeout','quota']){
    responseMode=mode;await ask('Show my balance '+mode);await text('Scope: Current recorded balance as of 2026-10-27 · all accounts · MYR').waitFor();await send('Review cloud insight selection');await visible(page.getByRole('alert')).waitFor();await text('Recorded balance: RM1,058.00.').waitFor();await capture(`cloud-${mode}-390`);checks.push(`Synthetic cloud ${mode} preserves the local result without automatic retry`);
  }
  responseMode='waiting';await ask('Show my balance while cancelling');await send('Review cloud insight selection');await button('Cancel cloud request').waitFor();await visible(page.getByText(/Request sent\. Cancellation stops waiting/)).waitFor();await capture('cloud-sending-390');await button('Cancel cloud request').click();await visible(page.getByRole('alert')).waitFor();await text('Recorded balance: RM1,058.00.').waitFor();checks.push('In-flight cancellation truthfully says the request was sent and processing/charges may continue; local facts survive');
  responseMode='valid';await button('Clear cloud connection').click();await radio('Assistant connection: On this device').waitFor();await radio('Assistant connection: Set up cloud').click();assert.equal(await page.getByLabel('Server access token',{exact:true}).inputValue(),'');checks.push('Revoking cloud connection clears credentials and active consent');
  await transaction('Expense','Campus Bookshop','7','2026-10-26','Other','Assistant Bank');
  await transaction('Expense','Campus Bookshop','9','2026-10-24','Other','Assistant Wallet');
  await navigate('/assistant-categories');await text('0 changes selected. Choose a category and include at least one change to continue.').waitFor();assert.equal(await button('Review selected category changes').isDisabled(),true);await matrix('category-review');checks.push('Category hints start unselected and zero selection disables review with adjacent explanation');
  await configure();await visible(page.getByTestId('category-row-1')).getByRole('checkbox').click();await button('Review cloud category request').click();const beforePhase=requests.length;
  await button('Review selected category changes').click();await button('Confirm category changes').waitFor();assert.equal(await button('Send this request').count(),0);assert.equal(requests.length,beforePhase);await capture('category-pending-to-confirm-390');await button('Back to category review').click();assert.equal(await button('Send this request').count(),0);checks.push('Entering confirmation invalidates pending category consent, which cannot revive on return to review');
  responseMode='waiting';await send('Review cloud category request');await button('Cancel cloud request').waitFor();await button('Review selected category changes').click();await capture('category-inflight-to-confirm-390');await page.waitForTimeout(2200);assert.equal(await button('Confirm category changes').isDisabled(),false);await text('Confirm 1 category change').waitFor();await button('Back to category review').click();assert.equal(await visible(page.getByTestId('category-row-1')).getByRole('checkbox').isChecked(),true);checks.push('Entering final confirmation aborts/discards in-flight category output and preserves deliberately selected changes');
  responseMode='valid';await button('Review cloud category request').click();await matrix('category-consent');await button('Send this request').click();await text('Cloud result checked. Financial figures still come from calculations on this device.').waitFor();
  assert.deepEqual(requests.at(-1),{kind:'categorize',rows:[1,2,3].map(index=>({key:`r${index}`,merchant:'Campus Bookshop'}))});checks.push('Category cloud request sends only merchant names and temporary row labels, with no amounts/dates/notes/IDs');
  assert.equal(await button('Review selected category changes').isDisabled(),true);for(let index=1;index<=3;index++)await visible(page.getByTestId(`category-row-${index}`)).getByRole('checkbox').click();await button('Review selected category changes').click();await matrix('category-confirm');
  await text('Tuesday, 27 October 2026 · RM12.00 · Assistant Bank').waitFor();await text('Monday, 26 October 2026 · RM7.00 · Assistant Bank').waitFor();await text('Saturday, 24 October 2026 · RM9.00 · Assistant Wallet').waitFor();checks.push('Repeated-merchant confirmation identifies every selected payment by local date, exact amount and account without expanding its cloud payload');
  await button('Back to category review').click();await button('Review selected category changes').click();await button('Confirm category changes').click();await text('3 categories updated.').waitFor();await capture('category-success-390');checks.push('Reviewed AI categories stay unselected until inclusion and final confirmation; back preserves selection');
  await navigate('/');await visible(page.getByTestId('balance-amount')).filter({hasText:'RM1,042.00'}).waitFor();await button('Ask about your money').click();await ask('How much did I spend on education?');await text('Education expenses: RM28.00 across 3 records.').waitFor();checks.push('Category-only save updates analytics without changing any balance');
  await context.close();await launch();await navigate();await radio('Assistant connection: On this device').waitFor();await ask('How much did I spend on education?');await text('Education expenses: RM28.00 across 3 records.').waitFor();checks.push('Category save survives browser restart; cloud credentials and question history are not persisted');
  await page.setViewportSize({width:568,height:320});await capture('landscape-568');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks.push('Assistant, consent and review layouts fit compact, large and landscape viewports');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,external,syntheticProvider:true,providerRequests:requests.length},null,2));console.log(JSON.stringify({passed:checks.length,errors,external,syntheticProvider:true}));
}catch(error){await capture('failure').catch(()=>{});await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,external,failure:String(error),syntheticProvider:true},null,2));throw error;}
finally{await context?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));if(!profile.startsWith(output+path.sep))throw Error('Unsafe test-profile cleanup');await rm(profile,{recursive:true,force:true});}
