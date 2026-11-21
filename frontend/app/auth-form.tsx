"use client";
import {useState} from 'react';
import {createAuthClient} from '@neon/auth/next';
const client=createAuthClient();
export function AuthForm({mode}:{mode:string}){
 const [error,E]=useState(''),[busy,B]=useState(false),[visible,V]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();B(true);E('');const f=new FormData(e.currentTarget),email=String(f.get('email')||''),password=String(f.get('password')||'');
 try{if(mode==='sign-up'||mode==='reset-password'){if(password!==f.get('confirm'))throw Error('Passwords must match.')}
 const result=mode==='sign-in'?await client.signIn.email({email,password,rememberMe:true}):mode==='sign-up'?await client.signUp.email({email,password,name:String(f.get('name')),callbackURL:'/account'}):mode==='forgot-password'?await client.requestPasswordReset({email,redirectTo:location.origin+'/reset-password'}):await client.resetPassword({newPassword:password,token:new URLSearchParams(location.search).get('token')||''});
 if(result.error)throw Error(result.error.message);if(mode==='sign-in')location.assign('/account');else E(mode==='sign-up'?'Account created. Check your email for verification, then sign in.':mode==='forgot-password'?'Check your email for a reset link.':'Password updated. You can sign in now.');
 }catch(err){E(err instanceof Error?err.message:'Please try again.')}finally{B(false)}}
 return <main className="wrap"><section className="panel"><a href="/">Bestie Breakout</a><h1>{mode.replaceAll('-',' ')}</h1><form onSubmit={submit}>{mode==='sign-up'&&<label>Display name<input name="name" required maxLength={40}/></label>}{mode!=='reset-password'&&<label>Email<input name="email" type="email" required autoComplete="email"/></label>}{mode!=='forgot-password'&&<><label>Password<input name="password" type={visible?'text':'password'} minLength={8} required autoComplete={mode==='sign-in'?'current-password':'new-password'}/></label><button type="button" onClick={()=>V(!visible)}>{visible?'Hide':'Show'} password</button></>}{['sign-up','reset-password'].includes(mode)&&<label>Confirm password<input name="confirm" type="password" required minLength={8}/></label>}<p role="status">{error}</p><button className="primary" disabled={busy}>{busy?'Working…':'Continue'}</button></form><p><a href="/sign-in">Sign in</a> · <a href="/sign-up">Create account</a> · <a href="/forgot-password">Reset password</a></p></section></main>
}
