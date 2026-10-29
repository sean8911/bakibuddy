import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { LedgerRepository, migrate, SCHEMA_VERSION, verifyLedgerDatabase } from '../src/storage/repository.ts';
import { createLedgerExport, ledgerRevision } from '../src/privacy/export.ts';

async function fixture(t) {
  const db=new DatabaseSync(':memory:');t.after(()=>db.close());
  const driver={exec:async sql=>db.exec(sql),all:async(sql,params=[])=>db.prepare(sql).all(...params),run:async(sql,params=[])=>db.prepare(sql).run(...params)};
  await migrate(driver);const repository=new LedgerRepository(driver,()=> '2026-10-28');
  await repository.saveAccount({id:'bank',name:'Fictional Bank',type:'bank',openingBalanceSen:100000});
  await repository.saveAccount({id:'wallet',name:'Fictional Wallet',type:'ewallet',openingBalanceSen:-100});
  await repository.saveTransaction({id:'expense',merchant:'Fictional Cafe',kind:'expense',category:'food',amountSen:1234,date:'2026-10-27',accountId:'bank',transferToAccountId:null,description:'Fictional note'});
  await repository.saveTransaction({id:'transfer',merchant:'Own transfer',kind:'transfer',category:'other',amountSen:5000,date:'2026-10-27',accountId:'bank',transferToAccountId:'wallet',description:''});
  await repository.saveBudgetPlan({cycle:'weekly',startDate:'2026-10-26',nextIncomeDate:'2026-11-02',savingsReserveSen:1000,spendingLimitSen:null});
  await repository.savePlannedItem({id:'bill',name:'Fictional bill',kind:'bill',amountSen:1234,date:'2026-10-27',repeat:'once',accountId:'bank',category:'food'});
  db.exec(`INSERT INTO settlements VALUES ('bill','2026-10-27','expense');
    INSERT INTO import_wallets VALUES ('fictional-wallet-hash','wallet');
    INSERT INTO import_receipts VALUES ('fictional-pdf-key','fictional-fingerprint','expense','fictional-wallet-hash');
    INSERT INTO scan_receipts VALUES ('fictional-image-key','transfer');`);
  return {db,driver,repository};
}
const at='2026-10-28T04:00:00.000Z';

test('JSON archive contains all ledger inputs and duplicate markers without derived figures or extra credentials',async t=>{
  const {repository}=await fixture(t),snapshot=await repository.load(),before=ledgerRevision(snapshot);
  snapshot.connectionToken='fictional-do-not-export';snapshot.accounts[0].secret='fictional-account-secret';snapshot.transactions[0].rawImage='fictional-image';
  const output=createLedgerExport(snapshot,'json',at),archive=JSON.parse(output.content);
  assert.equal(archive.formatVersion,1);assert.equal(archive.schemaVersion,4);assert.equal(archive.currency,'MYR');assert.equal(archive.timezone,'Asia/Kuala_Lumpur');assert.equal(archive.exportedAt,at);
  assert.equal(archive.accounts.length,2);assert.equal(archive.accounts.find(a=>a.id==='wallet').openingBalanceSen,-100);assert.equal(archive.transactions.length,2);assert.equal(archive.transactions.find(r=>r.id==='expense').amountSen,1234);
  assert.equal(archive.budget.items.length,1);assert.equal(archive.budget.settlements.length,1);assert.equal(archive.imports.receipts.length,1);assert.equal(archive.scans.length,1);
  for(const excluded of ['fictional-do-not-export','fictional-account-secret','fictional-image"','balanceSen','totals','created_at'])assert.equal(output.content.includes(excluded),false,excluded);
  assert.equal(ledgerRevision(await repository.load()),before);assert.equal(output.mime,'application/json');assert.match(output.name,/^bakibuddy-.*\.json$/);
});
test('CSV preserves exact sen/MYR and transfer identity, quoting delimiters and newlines without spreadsheet formulas',async t=>{
  const {repository}=await fixture(t),snapshot=await repository.load();
  snapshot.transactions[0].merchant=' =HYPERLINK("bad","bad")';snapshot.transactions[0].description='safe,"quoted"\nnext line';snapshot.accounts[0].name='＠SUM(1)';
  const output=createLedgerExport(snapshot,'csv',at);
  assert.equal(output.content.startsWith('\uFEFF'),true);assert.match(output.content,/"1234","12\.34"/);assert.match(output.content,/"5000","50\.00"/);assert.match(output.content,/"bank","[^\n]*","wallet","Fictional Wallet"/);
  assert.equal(output.content.includes('"\' =HYPERLINK(""bad"",""bad"")"'),true);assert.equal(output.content.includes('"\'＠SUM(1)"'),true);assert.equal(output.content.includes('"safe,""quoted""\nnext line"'),true);
  assert.equal(output.content.includes('savingsReserveSen'),false);assert.equal(output.content.includes('fictional-pdf-key'),false);
});
test('CSV neutralizes ASCII/fullwidth/whitespace formula prefixes while JSON retains original text',async t=>{
  const {repository}=await fixture(t),snapshot=await repository.load();
  for(const value of ['=1+1','+1','-1','@SUM(1)','\tformula','\nformula','\rformula','  ＝1','＋1','－1','＠SUM(1)']){
    snapshot.transactions[0].merchant=value;
    const csv=createLedgerExport(snapshot,'csv',at).content;
    assert.equal(csv.includes(`"'${value}"`),true,JSON.stringify(value));
    assert.equal(JSON.parse(createLedgerExport(snapshot,'json',at).content).transactions[0].merchant,value);
  }
});
test('exports handle an empty ledger, safe-integer endpoints and one-sen amounts without rounding',async t=>{
  const {repository}=await fixture(t);let snapshot=await repository.load();
  snapshot.transactions[0].amountSen=Number.MAX_SAFE_INTEGER;
  assert.equal(createLedgerExport(snapshot,'csv',at).content.includes('90071992547409.91'),true);
  snapshot.transactions[0].amountSen=1;assert.equal(createLedgerExport(snapshot,'csv',at).content.includes('"1","0.01"'),true);
  await repository.deleteAllLocalRecords(ledgerRevision(await repository.load()));snapshot=await repository.load();
  assert.equal(JSON.parse(createLedgerExport(snapshot,'json',at).content).transactions.length,0);assert.equal(createLedgerExport(snapshot,'csv',at).content.split('\r\n').length,2);
});
test('malformed, oversized and unsafe-number exports fail without changing records',async t=>{
  const {repository}=await fixture(t),snapshot=await repository.load(),before=ledgerRevision(snapshot);
  for(const amount of [NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1]){const copy=structuredClone(snapshot);copy.transactions[0].amountSen=amount;assert.throws(()=>createLedgerExport(copy,'json',at));}
  assert.throws(()=>createLedgerExport(snapshot,'html',at));assert.throws(()=>createLedgerExport(snapshot,'json','../../bad'));
  const huge=structuredClone(snapshot);huge.transactions[0].description='x'.repeat(21*1024*1024);assert.throws(()=>createLedgerExport(huge,'json',at),/20 MB/);
  assert.equal(ledgerRevision(await repository.load()),before);
});
test('confirmed deletion atomically clears every financial table while preserving schema/categories and fresh use',async t=>{
  const {db,repository}=await fixture(t),snapshot=await repository.load();
  const empty=await repository.deleteAllLocalRecords(ledgerRevision(snapshot));
  assert.deepEqual(empty.accounts,[]);assert.deepEqual(empty.transactions,[]);assert.deepEqual(empty.budget,{plan:null,items:[],settlements:[]});assert.deepEqual(empty.imports,{wallets:[],receipts:[]});assert.deepEqual(empty.scans,[]);assert.equal(empty.totals.balanceSen,0);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version,SCHEMA_VERSION);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM categories').get().n,10);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  await repository.saveAccount({id:'new',name:'New start',type:'cash',openingBalanceSen:1});assert.equal((await repository.load()).totals.balanceSen,1);
});
test('stale revision checks detect changed names, amounts, schedules, markers and missing confirmation',async t=>{
  const {db,repository}=await fixture(t);
  for(const sql of ["UPDATE accounts SET name='Changed' WHERE id='bank'","UPDATE transactions SET amount_sen=1235 WHERE id='expense'","UPDATE planned_items SET name='Changed schedule' WHERE id='bill'","UPDATE scan_receipts SET source_key='changed-key'"]){const old=ledgerRevision(await repository.load());db.exec(sql);await assert.rejects(repository.deleteAllLocalRecords(old),{code:'STALE'});assert.equal((await repository.load()).accounts.length,2);}
  await assert.rejects(repository.deleteAllLocalRecords(''),{code:'STALE'});
});
test('a real SQL failure late in deletion rolls back earlier child-table removal',async t=>{
  const {db,repository}=await fixture(t),before=ledgerRevision(await repository.load());
  db.exec("CREATE TRIGGER deny_delete BEFORE DELETE ON accounts BEGIN SELECT RAISE(ABORT,'fictional failure'); END;");
  await assert.rejects(repository.deleteAllLocalRecords(before));assert.equal(ledgerRevision(await repository.load()),before);
  db.exec('DROP TRIGGER deny_delete');await repository.deleteAllLocalRecords(before);assert.equal((await repository.load()).transactions.length,0);
});
test('queued writes invalidate old deletion consent; concurrent repeated deletion cannot erase a later ledger',async t=>{
  const {repository}=await fixture(t),before=ledgerRevision(await repository.load());
  const write=repository.saveAccount({id:'extra',name:'New account',type:'cash',openingBalanceSen:3});const deletion=repository.deleteAllLocalRecords(before);
  await write;await assert.rejects(deletion,{code:'STALE'});assert.equal((await repository.load()).accounts.length,3);
  const current=ledgerRevision(await repository.load());const results=await Promise.allSettled([repository.deleteAllLocalRecords(current),repository.deleteAllLocalRecords(current)]);
  assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');assert.equal((await repository.load()).accounts.length,0);
});
test('integrity recovery refuses orphaned database records without resetting them',async t=>{
  const {db,driver,repository}=await fixture(t),before=await repository.load();
  db.exec("PRAGMA foreign_keys=OFF; UPDATE transactions SET account_id='missing' WHERE id='expense';");
  await assert.rejects(migrate(driver),{code:'INTEGRITY'});
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n,before.transactions.length);
  db.exec("UPDATE transactions SET account_id='bank' WHERE id='expense';");
  await migrate(driver);assert.equal((await repository.load()).transactions.length,2);
});
test('failed quick-check responses are surfaced without exposing database diagnostics or resetting data',async()=>{
  for(const rows of [[],[{quick_check:'fictional private diagnostic'}]])await assert.rejects(verifyLedgerDatabase({all:async sql=>sql.includes('quick_check')?rows:[]}),error=>error.code==='INTEGRITY'&&!error.message.includes('fictional private diagnostic'));
});
