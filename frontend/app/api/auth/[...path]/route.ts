import {auth,configured} from '../../../../lib/auth';import {failure,json,limit,originCheck} from '../../../../lib/api';import {NextRequest} from 'next/server';
type Context={params:Promise<{path:string[]}>};
async function handler(r:NextRequest,c:Context){try{if(!configured())return json({error:'Neon Auth is not configured.'},503);originCheck(r);if(r.method!=='GET')limit('auth:'+(r.headers.get('x-real-ip')||'local'),120);
 const handlers=auth().handler();return await handlers[r.method as keyof typeof handlers](r,c)}catch(e){return failure(e)}}
export {handler as GET,handler as POST,handler as PATCH,handler as PUT,handler as DELETE};
