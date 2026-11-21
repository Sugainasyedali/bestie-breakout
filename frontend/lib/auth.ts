import 'server-only';
import {createNeonAuth} from '@neon/auth/next/server';
export const configured=()=>!!process.env.NEON_AUTH_BASE_URL&&!!process.env.NEON_AUTH_COOKIE_SECRET;
let instance:ReturnType<typeof createNeonAuth>|undefined;
export function auth(){if(!configured())throw Error('Account service unavailable');return instance??=createNeonAuth({baseUrl:process.env.NEON_AUTH_BASE_URL!,cookies:{secret:process.env.NEON_AUTH_COOKIE_SECRET!},logLevel:'silent'})}
export async function currentUser(){if(!configured())return null;const result=await auth().getSession();if(result.error&&result.error.status!==401)throw Error('Account service unavailable');return result.data?.user??null}
