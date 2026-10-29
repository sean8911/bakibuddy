import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Compare locally without ever printing environment contents or secret values.
const environment=await readFile('server/.env','utf8');
const secrets=environment.split(/\r?\n/).filter(line=>/^(GROQ_API_KEY|OPENAI_API_KEY|AI_SERVER_TOKEN)=/.test(line)).map(line=>line.slice(line.indexOf('=')+1).trim().replace(/^(['"])(.*)\1$/,'$2')).filter(value=>value.length>0);
let checked=0;
async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())await walk(file);else{assert.notEqual(entry.name,'.env','Environment file must not ship');const content=await readFile(file);for(const secret of secrets)assert.equal(content.includes(Buffer.from(secret)),false,'A local server credential was found in the export');checked++;}}}
await walk('dist');
console.log(JSON.stringify({exportFilesChecked:checked,configuredCredentialsAbsent:true,valuesPrinted:false}));
