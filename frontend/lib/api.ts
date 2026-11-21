import {currentUser} from './auth';import {profileFor} from '../../shared/database';
export class Problem extends Error{constructor(public status:number,message:string){super(message)}}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export function originCheck(r:Request){if(r.method!=='GET'&&r.method!=='HEAD'){const o=r.headers.get('origin');if(o&&o!==new URL(r.url).origin)throw new Problem(403,'Request origin rejected.')}}
const windows=new Map<string,{since:number;count:number}>();
export function limit(key:string,max:number){const now=Date.now();if(windows.size>10000)for(const [k,v] of windows)if(now-v.since>60000)windows.delete(k);let v=windows.get(key);if(!v||now-v.since>60000){v={since:now,count:0};windows.set(key,v)}if(++v.count>max)throw new Problem(429,'Too many requests. Try again in a minute.')}
export async function own(){const u=await currentUser();if(!u)throw new Problem(401,'Sign in to use your account.');return {u,p:await profileFor(u.id,u.name||'Bestie')}}
export function failure(e:unknown){if(e instanceof Problem)return json({error:e.message},e.status);if((e as {code?:string})?.code==='23505')return json({error:'That username is taken.'},409);return json({error:'The cloud service is unavailable. Try again shortly.'},503)}
