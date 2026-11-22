"use client";
import {useEffect,useRef} from 'react';
import {createRealtimeClient} from '@neon/realtime/client';
export function useLiveProgress(refresh:()=>void){
 const callback=useRef(refresh);callback.current=refresh;
 useEffect(()=>{let stopped=false,unsubscribe=()=>{},last='',refreshing=false;
 async function renew(){try{const r=await fetch('/api/player/live');if(!r.ok)return;const data=await r.json();if(!data||stopped)return;unsubscribe();const client=createRealtimeClient({url:data.url}),subscription=client.subscribe(data.sealed);unsubscribe=()=>{subscription.unsubscribe()};
 subscription.onChange(snapshot=>{const next=JSON.stringify(snapshot.data);if(next===last)return;last=next;if(!refreshing){refreshing=true;Promise.resolve(callback.current()).finally(()=>{refreshing=false})}})}catch{/* Ordinary account reads remain available when realtime is unavailable. */}}
 void renew();const interval=setInterval(renew,60000);return()=>{stopped=true;clearInterval(interval);unsubscribe()}},[]);
}
