import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.BAKIBUDDY_URL ?? 'http://localhost:8082';
const output = path.resolve(process.env.SCAN_RESULTS_DIR ?? 'test-results/phase6');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(output,'profile-'));
const checks = [], errors = [], externalRequests = [], readerEvents = [];
let context, page;
const visible = locator => locator.filter({ visible:true });
const button = name => visible(page.getByRole('button',{name,exact:true}));
const radio = name => visible(page.getByRole('radio',{name,exact:true}));
const checkbox = name => visible(page.getByRole('checkbox',{name,exact:true}));
const text = value => visible(page.getByText(value,{exact:true}));
async function launch() {
  context = await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:390,height:844},reducedMotion:'reduce'});
  context.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(base).origin) externalRequests.push(new URL(request.url()).origin); });
  await context.route('**/*', route => /^https?:/.test(route.request().url()) && new URL(route.request().url()).origin !== new URL(base).origin ? route.abort() : route.continue());
  page = await context.newPage(); page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(120000);
  await page.exposeFunction('recordOcrTestEvent', value => readerEvents.push(value));
  await page.addInitScript(() => addEventListener('message', event => {
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (message?.type || message?.base64) void window.recordOcrTestEvent({type:message.type ?? 'job',id:message.id,status:message.status,progress:message.progress,frame:window === top ? 'parent' : 'reader'});
    } catch { /* Test instrumentation never changes reader behavior or logs financial text. */ }
  }));
  await page.clock.setFixedTime(new Date('2026-10-27T04:00:00Z'));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if(message.type()==='error') errors.push(message.text()); });
}
async function navigate(route='/scan-receipt') { await page.goto(base+route,{waitUntil:'networkidle'});await visible(page.getByTestId('screen-title')).waitFor(); }
async function capture(name) {
  await page.evaluate(()=>document.fonts.ready);
  for(const [suffix,fraction] of [['',0],['-middle',.5],['-bottom',1]]) {
    await page.evaluate(fraction => { for(const element of document.querySelectorAll('div')) if(['auto','scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight+1 && element.getBoundingClientRect().width > 0) element.scrollTop=(element.scrollHeight-element.clientHeight)*fraction;window.scrollTo(0,0); },fraction);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(output,name+suffix+'.png'),fullPage:true});
  }
}
async function finished() { await page.waitForURL(url=>!/^\/account\//.test(url.pathname),{waitUntil:'networkidle'}); }
async function account(name,amount) { await navigate('/account/new');await page.getByLabel('Account name',{exact:true}).fill(name);await page.getByLabel('Opening balance (RM)',{exact:true}).fill(amount);await button('Save account').click();await finished(); }
async function choose(name) { const chooser = page.waitForEvent('filechooser');await button('Choose image').click();await (await chooser).setFiles(path.resolve('tests/fixtures/'+name));await button('Read image locally').waitFor(); }
async function read(expected) { await button('Read image locally').click();await text(`${expected} ${expected===1?'candidate':'candidates'} to check`).waitFor({timeout:150000}); }
async function edit(index,kind,{amount,date,merchant,other,direction}={}) {
  await button(`Review scan row ${index}`).click();await visible(page.getByTestId('scan-row-editor')).waitFor();
  if(amount!==undefined)await page.getByLabel('Amount (RM)',{exact:true}).fill(amount);
  if(date!==undefined)await page.getByLabel('Transaction date',{exact:true}).fill(date);
  if(merchant!==undefined)await page.getByLabel('Transaction name',{exact:true}).fill(merchant);
  await radio('Transaction type: '+kind).click();
  if(direction)await radio('Transfer direction: '+direction).click();
  if(other)await radio('Other tracked account: '+other).click();
}
async function include() {await checkbox('I checked the name, amount, date and type against the image').click();await button('Include reviewed row').click();await visible(page.getByTestId('scan-row-editor')).waitFor({state:'hidden'});}
async function confirm(count) {await button('Continue with reviewed rows').click();await button('Confirm scanned transactions').click();await text(`${count} reviewed ${count===1?'transaction saved':'transactions saved'}.`).waitFor();}

try {
  await launch();await navigate();await button('Add an account for scanning').waitFor();await capture('no-account-390');checks.push('Fresh scanner requires an account and never seeds financial records');
  await account('Scan Bank','1000');await account('Scan Wallet','500');await navigate();await radio('Selected account: Scan Wallet').click();await capture('empty-390');
  await choose('scan-fictional-receipt.png');await capture('image-selected-390');
  await button('Show full source image').click();await capture('source-expanded-390');await button('Collapse source image').click();checks.push('Source image expands for comparison and collapses without losing selection');
  await button('Read image locally').click();await capture('reading-390');await button('Review scan row 1').waitFor({timeout:150000});
  await text('0 reviewed rows selected. Categories start as Other.').waitFor();await capture('receipt-unreviewed-390');checks.push('Actual bundled OCR returns a receipt candidate with every row initially excluded');
  assert.equal(await button('Continue with reviewed rows').isDisabled(),true);await text('Review and include at least one row to continue. Already-saved rows cannot be selected.').waitFor();
  await button('Review scan row 1').click();assert.equal(await page.getByLabel('Amount (RM)',{exact:true}).inputValue(),'12.34');assert.equal(await page.getByLabel('Transaction date',{exact:true}).inputValue(),'2026-10-26');checks.push('Actual receipt OCR extracts total and full date without choosing tendered cash, change or line items');
  await button('Include reviewed row').click();await text('Check every field against the image, then tick the review confirmation.').waitFor();
  await radio('Transaction type: Expense').click();await page.getByLabel('Amount (RM)',{exact:true}).fill('12.345');await checkbox('I checked the name, amount, date and type against the image').click();await button('Include reviewed row').click();await visible(page.getByRole('alert')).waitFor();await capture('invalid-editor-390');
  await page.getByLabel('Amount (RM)',{exact:true}).fill('12.34');await page.getByLabel('Transaction name',{exact:true}).fill('Campus Moon Cafe');await checkbox('I checked the name, amount, date and type against the image').click();await button('Include reviewed row').click();await visible(page.getByTestId('scan-row-editor')).waitFor({state:'hidden'});checks.push('Review attestation and exact decimal validation prevent unchecked or invalid save');
  await button('Continue with reviewed rows').click();await visible(page.getByTestId('scan-confirm-totals')).waitFor();await text('Expenses: RM12.34').waitFor();await capture('receipt-confirm-390');
  await button('Back to scan review').click();await checkbox('Include scan row 1').waitFor();await confirm(1);await capture('receipt-success-390');checks.push('Back from confirmation retains selection; explicit confirmation saves one reviewed receipt');
  await button('Scan another image').click();await choose('scan-fictional-receipt.png');await read(1);await text('Already saved from this image').waitFor();assert.equal(await button('Review scan row 1').count(),0);assert.equal(await button('Continue with reviewed rows').isDisabled(),true);await capture('repeat-locked-390');checks.push('Repeated image is locked by persisted source identity');checks.push('Zero-selection and all-locked states disable continuation with an adjacent explanation');
  await button('Discard scan').click();await radio('Image layout: TNG Activity list').click();await choose('scan-fictional-activity.png');await read(4);await capture('activity-unreviewed-390');checks.push('Actual Activity OCR separates four transactions and excludes reward points');
  for(const width of [320,375,430,1440]) {await page.setViewportSize({width,height:width===1440?1000:844});await capture(`activity-unreviewed-${width}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}await page.setViewportSize({width:390,height:844});
  await edit(1,'Expense');assert.equal(await page.getByLabel('Amount (RM)',{exact:true}).inputValue(),'8.20');assert.equal(await page.getByLabel('Transaction date',{exact:true}).inputValue(),'2026-10-26');await include();
  await edit(2,'Expense');assert.equal(await page.getByLabel('Amount (RM)',{exact:true}).inputValue(),'4.00');await include();checks.push('Payment to another person can be reviewed as an expense');
  await edit(3,'Between my accounts');await checkbox('I checked the name, amount, date and type against the image').click();await button('Include reviewed row').click();await text('Row 3: choose the transfer direction and other tracked account.').waitFor();
  await radio('Transfer direction: Into selected account').click();await radio('Other tracked account: Scan Bank').click();await capture('transfer-editor-390');
  for(const width of [320,375,430,1440]) {await page.setViewportSize({width,height:width===1440?1000:844});await capture(`transfer-editor-${width}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}await page.setViewportSize({width:390,height:844});await include();
  await edit(4,'Refund');await include();checks.push('Reload requires explicit own-account direction/account; incoming refund stays separate');
  await button('Continue with reviewed rows').click();await text('Expenses: RM12.20').waitFor();await text('Refunds: RM2.00').waitFor();await text('Transfers: RM50.00').waitFor();assert.equal(await text('Account: Scan Wallet').count(),3);await capture('activity-confirm-390');
  for(const width of [320,375,430,1440]) {await page.setViewportSize({width,height:width===1440?1000:844});await capture(`activity-confirm-${width}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}await page.setViewportSize({width:390,height:844});await button('Confirm scanned transactions').click();await text('4 reviewed transactions saved.').waitFor();checks.push('Mixed scan batch confirms separate exact totals and atomically saves four rows');
  await navigate('/accounts');await text('RM527.46').waitFor();await text('RM950.00').waitFor();await navigate('/');await visible(page.getByTestId('balance-amount')).filter({hasText:'RM1,477.46'}).waitFor();checks.push('Both account balances and combined assets reconcile; own-bank reload creates no income');
  await context.close();await launch();await navigate();await radio('Selected account: Scan Wallet').click();await choose('scan-fictional-activity.png');await radio('Image layout: TNG Activity list').click();await read(4);assert.equal(await text('Already saved from this image').count(),4);checks.push('Image source locks and ledger survive complete browser process close/reopen');
  await button('Discard scan').click();await radio('Image layout: Receipt or payment detail').click();await choose('scan-fictional-overlap.png');await read(1);await edit(1,'Expense');await text('A record has the same date, amount and a shared account. It may already be recorded, even if its name or type differs.').waitFor();await checkbox('I checked the name, amount, date and type against the image').click();await button('Include reviewed row').click();await text('Exclude this row or confirm it is a separate payment.').waitFor();await capture('overlap-warning-390');
  await checkbox('This is a separate payment, not the existing record').click();await button('Include reviewed row').click();await visible(page.getByTestId('scan-row-editor')).waitFor({state:'hidden'});await button('Continue with reviewed rows').click();await button('Back to scan review').click();
  await edit(1,'New income');await checkbox('This is a separate payment, not the existing record').click();await include();await button('Continue with reviewed rows').click();await text('Account: Scan Wallet').waitFor();await capture('income-confirm-390');await button('Back to scan review').click();
  await edit(1,'Between my accounts',{direction:'Out of selected account',other:'Scan Bank'});await checkbox('This is a separate payment, not the existing record').click();await include();await button('Continue with reviewed rows').click();await text('From account: Scan Wallet · To account: Scan Bank').waitFor();await capture('outgoing-transfer-confirm-390');await button('Back to scan review').click();await button('Discard scan').click();checks.push('Confirmation uses neutral account wording for income and correct From/To for outgoing transfers');checks.push('Re-encoded overlapping image needs separate-payment acknowledgement; cancellation saves nothing');
  await context.setOffline(true);await choose('scan-fictional-receipt.png');await read(1);await text('Already saved from this image').waitFor();await context.setOffline(false);checks.push('Already-loaded reader performs real OCR with the browser offline');
  await button('Discard scan').click();await choose('scan-blank.png');await button('Read image locally').click();await text('No supported payment rows were found. Try the other layout or a clearer image. You can also enter the transaction manually.').waitFor({timeout:150000});await capture('blank-recovery-390');checks.push('Blank image recovers with retry/layout/manual choices and no candidate money');
  await button('Discard selected image').click();await choose('scan-fictional-activity.png');await radio('Image layout: TNG Activity list').click();await read(4);
  for(const width of [320,375,430,1440]) {
    await page.setViewportSize({width,height:width===1440?1000:844});await capture(`activity-review-${width}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.setViewportSize({width:568,height:320});await capture('activity-landscape-568');checks.push('Review layout fits 320/375/390/430/1440 widths and landscape without horizontal overflow');
  await button('Discard scan').click();await choose('scan-fictional-receipt.png');await button('Read image locally').click();await button('Cancel image reading').click();await button('Choose image').waitFor();await text('0 reviewed rows selected. Categories start as Other.').waitFor({state:'hidden'});checks.push('Cancelling an active reader removes image/job and leaves no review or records');
  await navigate('/transactions');await text('5 of 5 records · Tap a record to edit').waitFor();checks.push('Blank, overlap, repeated, offline and cancelled reads leave the five confirmed records unchanged');
  assert.deepEqual([...new Set(errors)],[],'No browser errors');assert.deepEqual(externalRequests,[],'No external requests');
  await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,externalRequests,readerEvents},null,2));console.log(JSON.stringify({passed:checks.length,errors,externalRequests}));
} catch(error) {await capture('failure').catch(()=>{});await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,externalRequests,readerEvents,failure:String(error)},null,2));throw error;}
finally {await context?.close();if(!profile.startsWith(output+path.sep))throw Error('Unsafe owned-profile cleanup');await rm(profile,{recursive:true,force:true});}
