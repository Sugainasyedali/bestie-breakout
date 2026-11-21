import {mkdir,readFile,readdir,rename,unlink,writeFile} from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import {saveAttempt,type Attempt} from '../../shared/database.js';
export function saveQueue(onSaved:(id:string)=>void){
 const dir=path.resolve(process.env.SAVE_QUEUE_DIR||'.bestie-saves'),memory=new Map<string,Attempt>();let flushing=false;
 async function flush(){if(flushing)return;flushing=true;try{await mkdir(dir,{recursive:true,mode:0o700});
 for(const [id,attempt] of memory){const tmp=path.join(dir,id+'.'+randomUUID()+'.tmp');await writeFile(tmp,JSON.stringify(attempt),{mode:0o600});await rename(tmp,path.join(dir,id+'.json'));memory.delete(id)}
 for(const file of (await readdir(dir)).filter(s=>s.endsWith('.json')).sort()){const a=JSON.parse(await readFile(path.join(dir,file),'utf8')) as Attempt;await saveAttempt(a);await unlink(path.join(dir,file));onSaved(a.id)}
 }catch{ /* Retry with immutable attempt IDs on the next interval. */ }finally{flushing=false}}
 const timer=setInterval(()=>{if(process.env.DATABASE_URL_POOLED||memory.size)void flush()},5000);timer.unref();return {add:(a:Attempt)=>{memory.set(a.id,a);void flush()},close:()=>clearInterval(timer)};
}
