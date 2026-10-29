import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createHash,randomUUID} from "node:crypto";
import {DatabaseSync} from "node:sqlite";
import {getDocument,OPS} from "pdfjs-dist/legacy/build/pdf.mjs";
import {extractPage} from "../src/importing/pdf-text.ts";
import {parseTngStatement} from "../src/importing/tng-parser.ts";
import {draftInput,prepareDrafts,selectedRecords,importTotals,possibleMatch} from "../src/importing/review.ts";
import {LedgerRepository,migrate,SCHEMA_VERSION} from "../src/storage/repository.ts";
import {buildSnapshot} from "../src/storage/ledger.ts";

const today="2026-10-27",hash=async(text)=>createHash("sha256").update(text).digest("hex");
async function extract(name="tng-fictional.pdf",password) {
  const task=getDocument({data:new Uint8Array(readFileSync(new URL(`fixtures/${name}`,import.meta.url))),password,verbosity:0,useWasm:false});
  try{const pdf=await task.promise,pages=[];for(let i=1;i<=pdf.numPages;i++)pages.push(await extractPage(await pdf.getPage(i),OPS));return {pages};}finally{await task.destroy();}
}
const extraction=await extract(),statement=parseTngStatement(extraction,today);
const account=(id="wallet",type="ewallet",openingBalanceSen=100000)=>({id,name:id,type,openingBalanceSen});
const base=buildSnapshot([account(),account("bank","bank")],[]);
async function drafts(snapshot=base,source=statement){return prepareDrafts(source,"wallet",snapshot,hash,randomUUID);}
async function setup(t) {
  const db=new DatabaseSync(":memory:");t.after(()=>db.close());
  const driver={exec:async(sql)=>db.exec(sql),all:async(sql,params=[])=>db.prepare(sql).all(...params),run:async(sql,params=[])=>db.prepare(sql).run(...params)};
  await migrate(driver);const repo=new LedgerRepository(driver,()=>today);
  await repo.saveAccount(account());await repo.saveAccount(account("bank","bank"));
  return {db,driver,repo};
}
async function expenseBatch(snapshot=base) {
  const {walletHash,rows}=await drafts(snapshot);rows[0].include=true;
  return {walletHash,rows,records:selectedRecords(rows,"wallet",snapshot,today)};
}
const changed=(mutate)=>{const copy=structuredClone(extraction);mutate(copy);return copy;};

test("verified PDF columns preserve wrapped references, dates and exact amounts independently of wallet balance",()=>{
  assert.equal(statement.rows.length,19);assert.equal(statement.pageCount,2);assert.equal(statement.goPlusRows,2);assert.equal(statement.unsuccessfulRows,1);
  assert.equal(statement.walletId,"9999000011112222");assert.equal(statement.startDate,"2026-10-01");
  assert.equal(statement.rows[0].reference,"202610010000000000000000000000000001");assert.equal(statement.rows[0].amountSen,1230);assert.equal(statement.rows[0].walletBalanceSen,8770);
  assert.equal(statement.rows[6].sourceType,"DUITNOW_RECEIVEFROM");assert.equal(statement.rows[6].direction,"credit");
  assert.equal(statement.rows.at(-1).merchant,"Campus Market 20");
});
test("AES password protected fixture extracts identically with the correct document password",async()=>{assert.deepEqual(await extract("tng-fictional-locked.pdf","fixture-pass"),extraction);});
test("missing and wrong PDF passwords fail before any rows are returned",async()=>{for(const password of [undefined,"wrong-fixture-password"])await assert.rejects(extract("tng-fictional-locked.pdf",password),{name:"PasswordException"});});
test("payments suggest expense; reloads, wallet transfers and incoming money remain unresolved",async()=>{
  const {rows}=await drafts();assert.equal(rows[0].kind,"expense");assert.equal(rows[0].include,false);
  for(const index of [1,2,3,4,6])assert.equal(rows[index].kind,"unresolved");
  assert.equal(rows[2].direction,"credit");assert.equal(rows[3].direction,"debit");
});
test("parser rejects missing title, wallet ID, required headers, portrait and image-only content",()=>{
  for(const word of ["TNG WALLET TRANSACTION HISTORY","Wallet ID","Wallet Balance"])assert.throws(()=>parseTngStatement(changed((x)=>{x.pages[0].items=x.pages[0].items.filter((i)=>i.text!==word);}),today));
  assert.throws(()=>parseTngStatement(changed((x)=>{x.pages[0].width=595;}),today));
  assert.throws(()=>parseTngStatement({pages:[{width:842,height:595,items:[]}]},today));
});
test("parser rejects malformed amounts, invalid dates, missing references and unknown statuses atomically",()=>{
  const cases=[[(i)=>i.text==="RM12.30","RM12.3"],[(i)=>i.text==="01/10/2026","31/02/2026"],[(i)=>i.text==="Success","Unexpected"],[(i)=>i.x===230,""]];
  for(const[predicate,text]of cases)assert.throws(()=>parseTngStatement(changed((x)=>{x.pages[0].items.find(predicate).text=text;}),today));
  assert.throws(()=>parseTngStatement(extraction,"2026-09-30"));
});
test("parser caps pages, row count, text count and characters",()=>{
  assert.throws(()=>parseTngStatement({pages:Array(101).fill(extraction.pages[0])},today));
  assert.throws(()=>parseTngStatement(changed((x)=>{x.pages[0].items[0].text="x".repeat(2000001);}),today));
  assert.throws(()=>parseTngStatement(changed((x)=>{x.pages[0].items=Array(100001).fill({text:"x",x:20,y:20});}),today));
  const page={width:842,height:595,items:[]};
  for(let index=0;index<2001;index++)for(const [x,text]of [[20,"01/10/2026"],[80,"Success"],[140,"Payment"],[230,`12345678${index}`],[295,"Cafe"],[657.55,"RM1.00"],[750.31,"RM1.00"]])page.items.push({x,y:index*3,text});
  assert.throws(()=>parseTngStatement({pages:[{...extraction.pages[0],items:extraction.pages[0].items.filter((i)=>i.y<180)},page]},today));
});
test("unknown source types require a direction and classification instead of inferring income",async()=>{
  const source=structuredClone(statement);source.rows[0].sourceType="Unknown movement";source.rows[0].direction="unknown";source.rows[0].suggestedKind=null;
  const{rows}=await drafts(base,source);rows[0].include=true;assert.throws(()=>selectedRecords(rows,"wallet",base,today));
});
test("preview and hash preparation never mutate the ledger; source keys ignore user edits",async()=>{
  const before=structuredClone(base),{rows}=await drafts();rows[0].merchant="Edited name";rows[0].amountSen=100;rows[0].include=true;
  const records=selectedRecords(rows,"wallet",base,today);assert.equal(records[0].input.amountSen,100);assert.deepEqual(base,before);
  assert.equal(records[0].sourceKey,(await drafts()).rows[0].sourceKey);
});
test("credit transfers reverse source/destination and all transfers stay out of income/expense",async()=>{
  const{rows}=await drafts();const credit={...rows[2],kind:"transfer",otherAccountId:"bank",include:true},debit={...rows[3],kind:"transfer",otherAccountId:"bank",include:true};
  assert.equal(draftInput(credit,"wallet").accountId,"bank");assert.equal(draftInput(credit,"wallet").transferToAccountId,"wallet");
  assert.equal(draftInput(debit,"wallet").accountId,"wallet");assert.equal(draftInput(debit,"wallet").transferToAccountId,"bank");
  const records=selectedRecords([credit,debit],"wallet",base,today);assert.deepEqual(importTotals(records),{expenses:0,income:0,refunds:0,transfers:2750});
});
test("unresolved, wrong-direction, missing-target and same-account transfers cannot continue",async()=>{
  const{rows}=await drafts();
  for(const change of [{},{kind:"expense"},{kind:"transfer"},{kind:"transfer",otherAccountId:"wallet"}])assert.throws(()=>selectedRecords([{...rows[2],include:true,...change}],"wallet",base,today));
  assert.throws(()=>selectedRecords([],"wallet",base,today));
});
test("duplicate detection ignores category and normalizes Unicode/spacing; transfers ignore names",()=>{
  const a={...base.transactions[0],merchant:"  Ｃafe  Tea ",kind:"expense",date:today,amountSen:100,accountId:"wallet",transferToAccountId:null};
  assert.equal(possibleMatch(a,{...a,merchant:"cafe tea",category:"other"}),true);
  assert.equal(possibleMatch({...a,kind:"transfer",transferToAccountId:"bank"},{...a,kind:"transfer",merchant:"Other side",transferToAccountId:"bank"}),true);
  assert.equal(possibleMatch(a,{...a,amountSen:101}),false);
});
test("possible manual and within-batch duplicates require a separate-payment acknowledgement",async()=>{
  const{rows}=await drafts();rows[0].include=true;
  const manual=buildSnapshot(base.accounts,[draftInput(rows[0],"wallet")]);assert.throws(()=>selectedRecords(rows,"wallet",manual,today));
  rows[0].duplicateApproved=true;assert.equal(selectedRecords(rows,"wallet",manual,today).length,1);
  const second={...rows[0],id:randomUUID(),sourceKey:await hash("another"),duplicateApproved:false};
  assert.throws(()=>selectedRecords([rows[0],second],"wallet",base,today));
});
test("same-source duplicates and conflicting source fingerprints lock on fresh preview",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();const saved=await repo.importTransactions("wallet",walletHash,records);
  assert.equal((await drafts(saved)).rows[0].lockedReason,"Already imported");
  const source=structuredClone(statement);source.rows[0].amountSen++;
  assert.match((await drafts(saved,source)).rows[0].lockedReason,/conflicts/);
});
test("wallet identity enforces the same account across overlapping statements",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();const saved=await repo.importTransactions("wallet",walletHash,records);
  await assert.rejects(prepareDrafts(statement,"bank",saved,hash,randomUUID));
  const other=structuredClone(statement);other.walletId="8888000011112222";await assert.rejects(drafts(saved,other));
});
test("atomic import saves exact totals and metadata but never raw wallet ID, password or PDF bytes",async(t)=>{
  const{repo,db}=await setup(t),{walletHash,records}=await expenseBatch();const saved=await repo.importTransactions("wallet",walletHash,records);
  assert.equal(saved.transactions.length,1);assert.equal(saved.totals.expenseSen,1230);assert.equal(saved.accounts.find((a)=>a.id==="wallet").balanceSen,98770);
  assert.equal(saved.imports.receipts.length,1);assert.equal(saved.imports.wallets[0].walletHash,walletHash);
  const persisted=JSON.stringify(db.prepare("SELECT * FROM import_receipts JOIN import_wallets USING(wallet_hash)").all());
  assert.ok(!persisted.includes(statement.walletId));assert.ok(!persisted.includes("fixture-pass"));assert.ok(!persisted.includes("base64"));
});
test("same file, overlapping ranges and repeated references cannot double-save, even with duplicate override",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();await repo.importTransactions("wallet",walletHash,records);
  await assert.rejects(repo.importTransactions("wallet",walletHash,records),{code:"IMPORT_DUPLICATE"});
  await assert.rejects(repo.importTransactions("wallet",walletHash,records.map((r)=>({...r,input:{...r.input,id:randomUUID()},allowPossibleDuplicate:true}))),{code:"IMPORT_DUPLICATE"});
  assert.equal((await repo.load()).transactions.length,1);
});
test("within-batch repeated keys roll back both records and wallet mapping",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();
  await assert.rejects(repo.importTransactions("wallet",walletHash,[records[0],{...records[0],input:{...records[0].input,id:randomUUID()}}]));
  assert.equal((await repo.load()).transactions.length,0);assert.equal((await repo.load()).imports.wallets.length,0);
});
test("repository checks possible manual duplicates again at commit",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();await repo.saveTransaction({...records[0].input,id:randomUUID(),category:"food"});
  await assert.rejects(repo.importTransactions("wallet",walletHash,records),{code:"DUPLICATE"});
  const saved=await repo.importTransactions("wallet",walletHash,[{...records[0],allowPossibleDuplicate:true}]);assert.equal(saved.transactions.length,2);
});
test("missing accounts, wrong direction, wrong wallet type and invalid hashes reject without writes",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();
  for(const [id,key,batch]of [["bank",walletHash,records],["wallet","invalid",records],["wallet",walletHash,[{...records[0],direction:"credit"}]],["wallet",walletHash,[{...records[0],input:{...records[0].input,accountId:"missing"}}]]])await assert.rejects(repo.importTransactions(id,key,batch));
  assert.equal((await repo.load()).transactions.length,0);
});
test("financial overflow rolls back an entire batch, then a valid retry works",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();
  const credit={...records[0],direction:"credit",input:{...records[0].input,kind:"income",amountSen:Number.MAX_SAFE_INTEGER}};
  await assert.rejects(repo.importTransactions("wallet",walletHash,[credit]));assert.equal((await repo.load()).imports.receipts.length,0);
  assert.equal((await repo.importTransactions("wallet",walletHash,records)).transactions.length,1);
});
test("injected SQL failure rolls back transaction, receipt and wallet link together",async(t)=>{
  const{repo,driver}=await setup(t),{walletHash,records}=await expenseBatch();
  const broken=new LedgerRepository({...driver,run:async(sql,params)=>{if(sql.startsWith("INSERT INTO import_receipts"))throw Error("Disk failure");return driver.run(sql,params);}},()=>today);
  await assert.rejects(broken.importTransactions("wallet",walletHash,records));
  const snapshot=await repo.load();assert.equal(snapshot.transactions.length,0);assert.equal(snapshot.imports.wallets.length,0);
  await repo.importTransactions("wallet",walletHash,records);
});
test("concurrent import submissions serialize and commit the statement once",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();
  const result=await Promise.allSettled([repo.importTransactions("wallet",walletHash,records),repo.importTransactions("wallet",walletHash,records)]);
  assert.equal(result.filter((r)=>r.status==="fulfilled").length,1);assert.equal((await repo.load()).transactions.length,1);
});
test("editing retains source identity; explicit deletion releases its reference for reimport",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();await repo.importTransactions("wallet",walletHash,records);
  const saved=await repo.saveTransaction({...records[0].input,merchant:"Edited manually"},true);assert.equal((await drafts(saved)).rows[0].lockedReason,"Already imported");
  const removed=await repo.deleteTransaction(records[0].input.id);assert.equal(removed.imports.receipts.length,0);
  await repo.importTransactions("wallet",walletHash,records);
});
test("linked wallet type remains eWallet; removing an empty linked account cleans its mapping",async(t)=>{
  const{repo}=await setup(t),{walletHash,records}=await expenseBatch();await repo.importTransactions("wallet",walletHash,records);
  await assert.rejects(repo.saveAccount(account("wallet","bank"),true));
  await repo.deleteTransaction(records[0].input.id);await repo.deleteAccount("wallet");assert.equal((await repo.load()).imports.wallets.length,0);
});
test("schema v2 upgrade preserves existing budgets, settlements, accounts and ledger atomically",async(t)=>{
  const{repo,driver}=await setup(t),{records}=await expenseBatch();await repo.saveTransaction(records[0].input);
  await repo.saveBudgetPlan({cycle:"monthly",startDate:"2026-10-01",nextIncomeDate:"2026-11-01",savingsReserveSen:100,spendingLimitSen:9000});
  await repo.savePlannedItem({id:"bill",name:"Cafe plan",kind:"bill",amountSen:1230,date:"2026-10-01",repeat:"once",accountId:"wallet",category:"other"});
  await repo.linkPlannedRecord({itemId:"bill",dueDate:"2026-10-01",transactionId:records[0].input.id});
  const before=await repo.load();await driver.exec("DROP TABLE scan_receipts; DROP TABLE import_receipts; DROP TABLE import_wallets; PRAGMA user_version=2;");
  const fault={...driver,exec:async(sql)=>{if(sql.includes("CREATE TABLE import_receipts")){await driver.exec("CREATE TABLE import_wallets(x TEXT)");throw Error("Interrupted migration");}return driver.exec(sql);}};
  await assert.rejects(migrate(fault));assert.equal((await driver.all("PRAGMA user_version"))[0].user_version,2);
  await migrate(driver);assert.deepEqual(await repo.load(),before);assert.equal((await driver.all("PRAGMA user_version"))[0].user_version,SCHEMA_VERSION);
});
test("SQL import keeps both transfer directions out of income and spending, and separates refunds",async(t)=>{
  const{repo}=await setup(t),{walletHash,rows}=await drafts();
  rows[2]={...rows[2],kind:"transfer",otherAccountId:"bank",include:true};
  rows[4]={...rows[4],kind:"transfer",otherAccountId:"bank",include:true};
  rows[6]={...rows[6],kind:"refund",include:true};
  const saved=await repo.importTransactions("wallet",walletHash,selectedRecords(rows,"wallet",base,today));
  assert.equal(saved.totals.incomeSen,0);assert.equal(saved.totals.expenseSen,0);assert.equal(saved.totals.refundSen,2500);
  assert.equal(saved.accounts.find((a)=>a.id==="wallet").balanceSen,103500);assert.equal(saved.accounts.find((a)=>a.id==="bank").balanceSen,99000);
});
