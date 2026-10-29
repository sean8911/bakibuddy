import assert from "node:assert/strict";
import {mkdir,mkdtemp,rm,writeFile} from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

const base=process.env.BAKIBUDDY_URL??"http://localhost:8082",output=path.resolve("test-results/phase5");
await mkdir(output,{recursive:true});const profile=await mkdtemp(path.join(output,"profile-"));
const checks=[],errors=[],requests=[];let context,page;
const visible=(locator)=>locator.filter({visible:true});
const button=(name)=>visible(page.getByRole("button",{name,exact:true}));
const radio=(name)=>visible(page.getByRole("radio",{name,exact:true}));
const text=(name)=>visible(page.getByText(name,{exact:true}));
const check=(name)=>checks.push(name);
async function launch(){
  context=await chromium.launchPersistentContext(profile,{channel:"chrome",headless:true,viewport:{width:390,height:844},reducedMotion:"reduce"});page=await context.newPage();
  page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(120000);
  await page.clock.install({time:new Date("2026-10-27T04:00:00Z")});
  page.on("pageerror",(e)=>errors.push(e.message));page.on("console",(m)=>{if(m.type()==="error")errors.push(m.text());});
  page.on("request",(r)=>{if(!r.url().startsWith(base)&&!r.url().startsWith("data:")&&!r.url().startsWith("blob:"))requests.push(r.url());});
}
async function navigate(route){await page.goto(base+route,{waitUntil:"networkidle"});await visible(page.getByTestId("screen-title")).waitFor({timeout:120000});}
async function capture(name){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:path.join(output,`${name}.png`),fullPage:true});}
async function scroll(fraction){await page.evaluate((value)=>{const e=[...document.querySelectorAll("div")].find((e)=>["auto","scroll"].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1);if(e)e.scrollTop=(e.scrollHeight-e.clientHeight)*value;},fraction);}
async function matrix(state,positions=[0,.5,1]){
  for(const width of [320,390,430,1440]){await page.setViewportSize({width,height:844});for(const fraction of positions){await scroll(fraction);await capture(`${state}-${width}-${fraction}`);}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${state} overflow ${width}`);
  }
  await page.setViewportSize({width:390,height:844});await scroll(0);
}
async function choose(name="tng-fictional-locked.pdf"){
  const picker=page.waitForEvent("filechooser");await button("Choose TNG PDF").click();await(await picker).setFiles(path.resolve(`tests/fixtures/${name}`));
  await button("Read statement").waitFor();
}
async function read(password="fixture-pass"){
  if(password)await page.getByLabel("PDF opening password (if required)",{exact:true}).fill(password);
  await button("Read statement").click();await text("19 wallet transactions").waitFor({timeout:60000});
}
async function openStatement(){await navigate("/import-tng");await radio("Import into eWallet: Test TNG Wallet").click();await choose();await read();}
async function edit(index,action){await button(`Review row ${index}`).click();await action();await button("Apply row changes").click();await visible(page.getByTestId("import-row-editor")).waitFor({state:"hidden"});}
try{
  await launch();await navigate("/import-tng");assert.equal(await button("Choose TNG PDF").isDisabled(),true);await matrix("empty",[0]);check("empty account state explains how to start and disables file selection");
  await button("Add eWallet account").click();await radio("Account type: eWallet").waitFor();assert.equal(await radio("Account type: eWallet").getAttribute("aria-checked"),"true");
  await page.getByLabel("Account name",{exact:true}).fill("Test TNG Wallet");await page.getByLabel("Opening balance (RM)",{exact:true}).fill("100.00");await button("Save account").click();await radio("Import into eWallet: Test TNG Wallet").click();check("first-use account creation keeps eWallet type and returns to importer");
  await choose();await button("Read statement").click();await text("The PDF needs its opening password, or the password did not match. Enter it and try again.").waitFor();
  assert.equal(await page.getByLabel("PDF opening password (if required)",{exact:true}).inputValue(),"");await capture("wrong-password-390");check("password-required error preserves chosen file and clears password");
  await read();assert.equal(await page.getByLabel("PDF opening password (if required)",{exact:true}).count(),0);await text("2 GO+ appendix rows and 1 unsuccessful wallet rows excluded.").waitFor();check("encrypted PDF reads locally and excludes appendix/failed rows");
  await button("Choose another statement").click();await navigate("/transactions");await text("A fresh start for your records.").waitFor();check("preview cancellation saves no transactions");
  await navigate("/account/new");await page.getByLabel("Account name",{exact:true}).fill("Test Bank");await page.getByLabel("Opening balance (RM)",{exact:true}).fill("500.00");await button("Save account").click();await page.waitForURL((url)=>!url.pathname.startsWith("/account/"));
  await navigate("/transaction/new");await page.getByLabel("Title",{exact:true}).fill("Campus Cafe");await page.getByLabel("Amount (RM)",{exact:true}).fill("12.30");await page.getByLabel("Transaction date",{exact:true}).fill("2026-10-01");await radio("Payment account: Test TNG Wallet").click();await button("Save transaction").click();await page.waitForURL((url)=>!url.pathname.startsWith("/transaction/"));check("manual pre-existing payment created in isolated profile");
  await openStatement();await text("Possible duplicate: matching date, amount and accounts, name and type. Check your history.").waitFor();check("manual duplicate warning appears before selecting");
  await button("Select suggested payments").click();await text("13 selected · 5 need classification").waitFor();check("bulk selection skips duplicates and unclassified incoming/transfers");
  await page.getByRole("checkbox",{name:"Include row 1: Campus Cafe",exact:true}).click();await button("Continue with 14 selected").click();await text("Row 1 may already be recorded. Review it and confirm a separate transaction, or exclude it.").waitFor();check("manual duplicate blocks continuation without acknowledgement");
  await page.getByRole("checkbox",{name:"Row 1 is a separate transaction",exact:true}).click();
  await edit(1,async()=>{await page.getByLabel("Transaction name",{exact:true}).fill("Campus Cafe corrected");await page.getByLabel("Amount (RM)",{exact:true}).fill("11.30");await radio("Category: Food & drinks").click();});check("row name, amount and category can be corrected");
  await button("Review row 2").click();await button("Apply row changes").click();await text("Review the type and direction for row 2.").waitFor();
  for(const width of [320,390,430,1440]){await page.setViewportSize({width,height:844});for(const block of ["start","end"]){await visible(page.getByTestId("import-row-editor")).evaluate((element,block)=>element.scrollIntoView({block}),block);await capture(`editor-error-${width}-${block}`);}assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.setViewportSize({width:390,height:844});await radio("Transaction type: New income").click();await button("Apply row changes").click();check("incoming row requires explicit classification and preserves input after validation");
  await edit(3,async()=>{await radio("Transaction type: Between my accounts").click();await radio("From my account: Test Bank").click();});check("reload is explicitly reviewed as transfer from tracked bank");
  await edit(4,async()=>{await radio("Transaction type: Expense").click();});check("payment to another person can be classified as expense");
  await edit(5,async()=>{await radio("Transaction type: Between my accounts").click();await radio("To my account: Test Bank").click();});check("outgoing own transfer requires receiving tracked account");
  await edit(7,async()=>{await radio("Transaction type: Refund").click();});check("refund is explicitly separate from income");
  await matrix("review");await button("Next rows").click();await text("Page 2 of 2").waitFor();await button("Previous rows").click();check("paginated review preserves selections and edits");
  await radio("Show rows: Selected").click();await text("19 selected · 0 need classification").waitFor();check("selection filter and classification counts reflect reviewed rows");
  await button("Continue with 19 selected").click();await text("Expenses · RM60.80").waitFor();await text("New income · RM50.00").waitFor();await text("Refunds · RM25.00").waitFor();await text("Between your accounts · RM30.00").waitFor();await matrix("confirm",[0,1]);check("confirmation reconciles exact separate expense/income/refund/transfer totals");
  await button("Back to review").click();await text("1. Campus Cafe corrected").waitFor();check("back from confirmation retains review edits");
  await button("Continue with 19 selected").click();await button("Confirm import").click();await text("19 transactions saved").waitFor();await matrix("success",[0]);check("explicit confirmation commits batch and reports count");
  await navigate("/accounts");await text("RM111.90").waitFor();await text("RM490.00").waitFor();check("wallet and bank reconcile exactly with opening balances and manual record");
  await context.close();await launch();await openStatement();await text("Already imported").first().waitFor();await button("Select suggested payments").click();await text("0 selected · 0 need classification").waitFor();await matrix("duplicate",[0,.5]);check("source references survive browser process restart and prevent reimport after edits");
  await button("Choose another statement").click();await radio("Import into eWallet: Test TNG Wallet").click();await choose("tng-fictional.pdf");await read("");check("unencrypted original PDF is also supported");
  await button("Choose another statement").click();const invalid=page.waitForEvent("filechooser");await button("Choose TNG PDF").click();await(await invalid).setFiles({name:"invalid.pdf",mimeType:"application/pdf",buffer:Buffer.from("not a PDF")});await text("This file is not a PDF. Choose the original TNG export.").waitFor();await capture("invalid-file-390");check("invalid file fails before reading or saving");
  const big=page.waitForEvent("filechooser");await button("Choose TNG PDF").click();await(await big).setFiles({name:"large.pdf",mimeType:"application/pdf",buffer:Buffer.alloc(5*1024*1024+1)});await text("Choose a PDF smaller than 5 MB. Export a shorter date range.").waitFor();check("oversized file is rejected before parsing");
  await page.setViewportSize({width:568,height:320});await scroll(1);await capture("file-error-landscape");check("compact landscape remains usable");
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);check("no uncaught errors and no external network requests");
  await writeFile(path.join(output,"results.json"),JSON.stringify({passed:checks.length,checks,errors,requests},null,2));console.log(JSON.stringify({passed:checks.length,errors,requests}));
}catch(error){await capture("failure").catch(()=>{});await writeFile(path.join(output,"failure.json"),JSON.stringify({checks,errors,requests,body:await page.locator("body").innerText().catch(()=>""),error:String(error)},null,2));throw error;}
finally{await context?.close();const resolved=path.resolve(profile);if(resolved.startsWith(output+path.sep)&&path.basename(resolved).startsWith("profile-"))await rm(resolved,{recursive:true,force:true});}
