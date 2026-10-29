import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execute=promisify(execFile);
async function sandbox(t){
  const parent=path.resolve(os.tmpdir()),directory=await mkdtemp(path.join(parent,'bakibuddy-groq-setup-'));
  assert.equal(path.dirname(path.resolve(directory)),parent);
  assert.ok(path.basename(directory).startsWith('bakibuddy-groq-setup-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  await copyFile(new URL('../server/setup.mjs',import.meta.url),path.join(directory,'setup.mjs'));
  const run=()=>execute(process.execPath,[path.join(directory,'setup.mjs')],{cwd:directory});
  return {run,environment:path.join(directory,'.env')};
}
test('new Groq setup creates a separate random companion token and no provider key',async t=>{
  const {run,environment}=await sandbox(t),{stdout,stderr}=await run(),text=await readFile(environment,'utf8');
  assert.match(text,/^GROQ_API_KEY=$/m);assert.match(text,/^GROQ_MODEL=openai\/gpt-oss-20b$/m);
  const token=text.match(/^AI_SERVER_TOKEN=([a-f0-9]{64})$/m)?.[1];assert.ok(token);
  assert.equal(stdout.includes(token),false);assert.equal(stderr,'');assert.equal(text.includes('OPENAI_API_KEY'),false);
});
test('legacy setup migration appends Groq defaults without overwriting or printing existing values',async t=>{
  const {run,environment}=await sandbox(t),legacy='OPENAI_API_KEY=fictional-legacy-key\nOPENAI_MODEL=old-model\nAI_SERVER_TOKEN=fictional-companion-token\nAI_HOST=0.0.0.0\nAI_ALLOW_LAN_HTTP=true';
  await writeFile(environment,legacy);const {stdout}=await run(),text=await readFile(environment,'utf8');
  assert.equal(text.startsWith(legacy),true);assert.match(text,/^GROQ_API_KEY=$/m);assert.match(text,/^GROQ_MODEL=openai\/gpt-oss-20b$/m);
  assert.equal(stdout.includes('fictional-legacy-key'),false);assert.equal(stdout.includes('fictional-companion-token'),false);
  await run();assert.equal(await readFile(environment,'utf8'),text);
});
test('existing Groq configuration is preserved byte-for-byte across repeated setup',async t=>{
  const {run,environment}=await sandbox(t),configured='# user settings\r\nGROQ_API_KEY=fictional-groq-key\r\nGROQ_MODEL=openai/gpt-oss-120b\r\nAI_SERVER_TOKEN=fictional-token\r\n';
  await writeFile(environment,configured);const {stdout}=await run();await run();assert.equal(await readFile(environment,'utf8'),configured);
  assert.equal(stdout.includes('fictional-groq-key'),false);assert.equal(stdout.includes('fictional-token'),false);
});
