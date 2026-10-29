import { createAssistantServer } from './app.mjs';
import { GROQ_MODEL } from './provider.mjs';
const host=process.env.AI_HOST??'127.0.0.1';
if(!['127.0.0.1','localhost','0.0.0.0'].includes(host))throw new Error('Use localhost, or explicit 0.0.0.0 for a private development network.');
if(host==='0.0.0.0'&&process.env.AI_ALLOW_LAN_HTTP!=='true')throw new Error('For private phone testing, explicitly set AI_ALLOW_LAN_HTTP=true. Remote hosting needs a separate HTTPS/authentication review.');
const port=Number(process.env.AI_PORT??8787);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Choose a valid AI_PORT.');
const server=createAssistantServer({apiKey:process.env.GROQ_API_KEY,token:process.env.AI_SERVER_TOKEN,model:process.env.GROQ_MODEL??GROQ_MODEL,...(process.env.AI_ALLOWED_ORIGINS?{origins:process.env.AI_ALLOWED_ORIGINS.split(',').map(value=>value.trim()).filter(Boolean)}:{})});
server.listen(port,host,()=>console.log(`BakiBuddy companion listening on ${host}:${port}. API keys/tokens/request data are not logged. Configure the server before enabling cloud requests.`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
