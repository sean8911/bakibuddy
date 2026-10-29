import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const path=new URL('./.env',import.meta.url);
try {
  await writeFile(path,`# Private companion configuration. Never copy into Expo/public variables.\nGROQ_API_KEY=\nGROQ_MODEL=openai/gpt-oss-20b\nAI_SERVER_TOKEN=${randomBytes(32).toString('hex')}\nAI_HOST=127.0.0.1\nAI_PORT=8787\nAI_ALLOW_LAN_HTTP=false\n`,{flag:'wx',mode:0o600});
  console.log('Created server/.env with a random server access token. Add your Groq API key locally. This command never prints either secret.');
} catch(error) {
  if(error.code!=='EEXIST')throw error;
  const existing=await readFile(path,'utf8'),missing=[];
  if(!/^\s*GROQ_API_KEY\s*=/m.test(existing))missing.push('GROQ_API_KEY=');
  if(!/^\s*GROQ_MODEL\s*=/m.test(existing))missing.push('GROQ_MODEL=openai/gpt-oss-20b');
  if(missing.length)await writeFile(path,`\n# Groq configuration. Legacy provider values above are unused.\n${missing.join('\n')}\n`,{flag:'a',mode:0o600});
  console.log('Existing server/.env values and token preserved. Added missing Groq settings if needed; enter your Groq API key locally. No secret values are printed.');
}
