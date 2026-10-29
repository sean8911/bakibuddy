// Host-only benchmark on fictional in-memory records; never opens the app database.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdir,writeFile} from 'node:fs/promises';
import {LedgerRepository,migrate} from '../src/storage/repository.ts';
import {calculateAnalytics} from '../src/analytics/engine.ts';
import {createLedgerExport} from '../src/privacy/export.ts';

const db=new DatabaseSync(':memory:');
const driver={exec:async sql=>db.exec(sql),all:async(sql,params=[])=>db.prepare(sql).all(...params),run:async(sql,params=[])=>db.prepare(sql).run(...params)};
try{
  await migrate(driver);db.exec("INSERT INTO accounts VALUES ('fictional','Fictional performance ledger','bank',5000000)");
  const insert=db.prepare("INSERT INTO transactions VALUES (?,?,'expense','food',125,'2026-10-27','fictional',NULL,'Fictional record','2026-10-27T00:00:00Z')");
  db.exec('BEGIN');for(let i=0;i<10000;i++)insert.run(`fictional-${i}`,`Fictional payment ${i}`);db.exec('COMMIT');
  const repository=new LedgerRepository(driver,()=> '2026-10-28'),samples=[];
  for(let i=0;i<3;i++){
    let start=performance.now();const snapshot=await repository.load();const loadMs=performance.now()-start;
    start=performance.now();const analytics=calculateAnalytics(snapshot,{start:'2026-10-01',end:'2026-10-28'},'2026-10-28');const analyticsMs=performance.now()-start;
    start=performance.now();const json=createLedgerExport(snapshot,'json','2026-10-28T04:00:00.000Z');const jsonMs=performance.now()-start;
    start=performance.now();createLedgerExport(snapshot,'csv','2026-10-28T04:00:00.000Z');const csvMs=performance.now()-start;
    assert.equal(snapshot.transactions.length,10000);assert.equal(snapshot.totals.expenseSen,1250000);assert.equal(analytics.current.expenseSen,1250000);assert.equal(JSON.parse(json.content).transactions.length,10000);
    samples.push({loadMs,analyticsMs,jsonMs,csvMs,jsonBytes:Buffer.byteLength(json.content)});
  }
  const result={scope:'Node host, fictional SQLite in memory; not device/frame-rate evidence',records:10000,samples};
  await mkdir('test-results/phase8',{recursive:true});await writeFile('test-results/phase8/performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{db.close();}
