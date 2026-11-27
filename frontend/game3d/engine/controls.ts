"use client";
import {useEffect,useRef} from 'react';
import type {Input3D} from '../../../shared/game3d/types';
import type {CameraRig} from '../cameras/follow';
export const defaultBindings={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',run:'ShiftLeft',interact:'KeyE',drop:'KeyF'};
export type Bindings=typeof defaultBindings;
export function useControls({rig,round,active,send,interact,pause,info,bindings}:{rig:React.MutableRefObject<CameraRig>;round:number;active:boolean;send:(p:Input3D)=>void;interact:(drop:boolean)=>void;pause:()=>void;info:(open:boolean)=>void;bindings:Bindings}){
 const keys=useRef(new Set<string>()),touch=useRef({x:0,y:0}),jump=useRef(false),seq=useRef(Date.now()),latest=useRef({active,send,interact,pause,info,round,bindings});latest.current={active,send,interact,pause,info,round,bindings};
 useEffect(()=>{if(!active){keys.current.clear();touch.current={x:0,y:0};jump.current=false}},[active]);
 useEffect(()=>{
 const clear=()=>{keys.current.clear();touch.current={x:0,y:0};jump.current=false;latest.current.info(false);latest.current.send({x:0,z:0,climb:0,jump:false,sprint:false,seq:++seq.current,round:latest.current.round})};
 const keydown=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable=true]'))return;const v=latest.current,b=v.bindings;if([...Object.values(b),'Escape','Tab'].includes(e.code))e.preventDefault();if(e.code==='Escape'&&!e.repeat)v.pause();if(e.code==='Tab')v.info(true);if(!v.active||e.repeat)return;keys.current.add(e.code);if(e.code===b.jump)jump.current=true;if(e.code===b.interact)v.interact(false);if(e.code===b.drop)v.interact(true)};
 const keyup=(e:KeyboardEvent)=>{keys.current.delete(e.code);if(e.code==='Tab')latest.current.info(false)};
 window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 const timer=setInterval(()=>{const v=latest.current;if(!v.active)return;const b=v.bindings,side=Number(keys.current.has(b.right))-Number(keys.current.has(b.left))+touch.current.x,forward=Number(keys.current.has(b.forward))-Number(keys.current.has(b.back))-touch.current.y,length=Math.max(1,Math.hypot(side,forward)),yaw=rig.current.yaw;
 v.send({x:(side*Math.cos(yaw)-forward*Math.sin(yaw))/length,z:(-forward*Math.cos(yaw)-side*Math.sin(yaw))/length,climb:Math.max(-1,Math.min(1,forward)),jump:jump.current,sprint:keys.current.has(b.run),seq:++seq.current,round:v.round});jump.current=false;},50);
 return()=>{clearInterval(timer);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);clear()};
 },[rig]);
 return {touch,jump};
}
