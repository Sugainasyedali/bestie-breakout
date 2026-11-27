"use client";
import {Suspense,useEffect,useRef} from 'react';
import {Canvas} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import type {View} from '../../../shared/model';
import {Adventurer} from '../characters/adventurer';
import {interaction} from '../../../shared/game3d/village';
import {Village} from '../scenes/village';
import {FollowCamera,type CameraRig} from '../cameras/follow';
export type Quality='low'|'medium'|'high';
function World({v,seat,rig,ready,quality,msg}:{v:View;seat:number;rig:React.MutableRefObject<CameraRig>;ready:()=>void;quality:Quality;msg:string}){
 const target=useRef(new THREE.Vector3(...v.adventure!.players[seat].position));
 useEffect(()=>{ready()},[v.round]);
 const s=v.adventure!;
 return <><color attach="background" args={['#bce0ed']}/><fog attach="fog" args={['#bce0ed',32,90]}/><hemisphereLight args={['#fff7e6','#659979',2.1]}/><directionalLight position={[-14,24,10]} intensity={2.5} castShadow={quality!=='low'} shadow-mapSize={quality==='high'?[2048,2048]:[1024,1024]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-normalBias={.04}/><Village state={s} detail={quality} highlight={interaction(s,seat)?.id}/>{s.players.map((state,i)=><Adventurer key={v.players[i].id} state={state} player={v.players[i]} local={i===seat} onPosition={i===seat?position=>target.current.copy(position):undefined} reaction={msg.startsWith(v.players[i].id+'|')?msg.split('|')[1]:undefined}/>)}<FollowCamera target={target} rig={rig} open={s.gate}/></>;
}
export default function Scene(props:Parameters<typeof World>[0]){return <Canvas shadows={props.quality!=='low'} dpr={props.quality==='low'?1:props.quality==='medium'?[1,1.5]:[1,2]} camera={{position:[0,8,20],fov:52,near:.1,far:120}} gl={{antialias:props.quality!=='low',powerPreference:'high-performance'}}><Suspense fallback={<Html center><div className="g3-loading">Packing the village…</div></Html>}><World {...props}/></Suspense></Canvas>}
