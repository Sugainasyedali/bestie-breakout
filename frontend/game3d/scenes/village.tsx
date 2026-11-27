"use client";
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {village,villageBlocks} from '../../../shared/game3d/village';
import type {AdventureState,Vec3} from '../../../shared/game3d/types';
const wood='#9d724e';
function Box({position,size,color}:{position:Vec3;size:Vec3;color:string}){return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.88}/></mesh>}
function Tree({position,scale=1}:{position:Vec3;scale?:number}){return <group position={position} scale={scale}><mesh position={[0,1.1,0]} castShadow><cylinderGeometry args={[.18,.28,2.2,7]}/><meshStandardMaterial color="#88664a"/></mesh><mesh position={[0,2.7,0]} castShadow><icosahedronGeometry args={[1.35,1]}/><meshStandardMaterial color="#558e58" flatShading/></mesh><mesh position={[.5,3.4,0]} castShadow><icosahedronGeometry args={[.85,0]}/><meshStandardMaterial color="#83ad64" flatShading/></mesh></group>}
function Key({position,color,active=false}:{position:Vec3;color:string;active?:boolean}){const ref=useRef<THREE.Group>(null);useFrame(({clock})=>{if(ref.current){ref.current.rotation.y=clock.elapsedTime;ref.current.position.y=position[1]+Math.sin(clock.elapsedTime*2)*.08}});return <group ref={ref} position={position}><mesh castShadow><torusGeometry args={[.18,.06,6,12]}/><meshStandardMaterial color={color} emissive={active?color:"#000000"} emissiveIntensity={.5} metalness={.5} roughness={.35}/></mesh><Box position={[0,-.3,0]} size={[.08,.4,.08]} color={color}/><Box position={[.08,-.42,0]} size={[.2,.07,.08]} color={color}/><pointLight color={color} intensity={1.5} distance={2}/></group>}
function Windmill(){const rotor=useRef<THREE.Group>(null);useFrame((_,dt)=>{if(rotor.current)rotor.current.rotation.z+=dt*.4});return <group position={[-12,0,-16]}><mesh position={[0,2.5,0]} castShadow><cylinderGeometry args={[1,1.6,5,8]}/><meshStandardMaterial color="#e6d4b4"/></mesh><mesh position={[0,5.7,0]} castShadow><coneGeometry args={[1.6,1.8,8]}/><meshStandardMaterial color="#8b6a69"/></mesh><group ref={rotor} position={[0,4.3,1.2]}>{[0,1,2,3].map(i=><group key={i} rotation={[0,0,i*Math.PI/2]}><Box position={[0,1.3,0]} size={[.45,2.5,.13]} color="#f2e5c8"/></group>)}</group></group>}
export function Village({state,detail,highlight}:{state:AdventureState;highlight?:string;detail:'low'|'medium'|'high'}){
 const gate=useRef<THREE.Group>(null);useFrame((_,dt)=>{if(gate.current)gate.current.position.y=THREE.MathUtils.damp(gate.current.position.y,state.gate?4.8:0,5,dt)});
 return <group>
 {villageBlocks.filter(b=>b.id!=='gate').map(b=><group key={b.id}><Box position={b.position} size={b.size} color={b.color}/>{b.kind==='house'&&<><mesh position={[b.position[0],b.position[1]+b.size[1]/2+.85,b.position[2]]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[4,2.1,4]}/><meshStandardMaterial color="#b67b68" flatShading/></mesh><Box position={[b.position[0],1.1,b.position[2]+b.size[2]/2+.02]} size={[1,2.1,.08]} color="#765b4b"/>{[-1.6,1.6].map(x=><Box key={x} position={[b.position[0]+x,2,b.position[2]+b.size[2]/2+.06]} size={[.7,.8,.07]} color="#8ec7cb"/>)}</>}</group>)}
 <group ref={gate}><Box position={[0,2,-12]} size={[4,4,.5]} color={wood}/>{[-1.5,-.75,0,.75,1.5].map(x=><Box key={x} position={[x,2,-11.7]} size={[.08,3.8,.08]} color="#594d46"/>)}<Box position={[0,3.8,-12]} size={[4.2,.2,.8]} color="#d2ad71"/></group>
 {[-2.3,2.3].map(x=><group key={x}><Box position={[x,2.4,-12]} size={[.6,4.8,1.2]} color="#e2ceb0"/><mesh position={[x,5,-12]}><coneGeometry args={[.55,.6,4]}/><meshStandardMaterial color="#b57a68"/></mesh></group>)}
 <mesh position={[0,-.35,-3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[36,2.5]}/><meshStandardMaterial color="#65b8c6" roughness={.22} transparent opacity={.85}/></mesh>
 <mesh position={[0,-4,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[200,200]}/><meshStandardMaterial color="#89c9d2"/></mesh>
 <Box position={village.plate} size={[1.6,.2,1.6]} color={state.plate?'#f8d97b':'#b3a0d1'}/>
 <Html position={[4,1.1,1]} center distanceFactor={15}><span className="g3-world-label">HOLD TO LOWER LADDER</span></Html>
 <group position={[9,state.ladder?0:3,-2.4]}>{[-.5,.5].map(x=><Box key={x} position={[x,2,0]} size={[.15,4.5,.15]} color={wood}/>)}{Array.from({length:11},(_,i)=><Box key={i} position={[0,.2+i*.4,0]} size={[1,.1,.13]} color="#dfb981"/>)}</group>
 <Box position={village.latch} size={[.5,.8,.5]} color={highlight==='latch'?'#fff5c8':state.ladderLatched?'#90d3a3':'#ca9ae2'}/>
 {state.keys.map((key,i)=>!key.delivered&&key.holder===null&&<Key key={key.id} position={key.position} active={highlight===key.id} color={i?'#9de6eb':'#ffcd76'}/>)}
 {village.sockets.map((position,i)=><group key={i}><Box position={[position[0],.45,position[2]]} size={[.7,.9,.7]} color="#aaa78e"/><mesh position={position}><torusGeometry args={[.22,.08,8,16]}/><meshStandardMaterial color={state.keys[i].delivered?'#a2efa3':i?'#9de6eb':'#ffcd76'} emissive={state.keys[i].delivered?'#457a36':'#000000'}/></mesh></group>)}
 {state.keys.map((key,i)=>key.holder!==null&&<Key key={'held'+i} position={key.position} active={highlight===key.id} color={i?'#9de6eb':'#ffcd76'}/>)}
 <mesh position={[0,.04,-17]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.3,2.65,40]}/><meshStandardMaterial color={state.gate?'#ffe7a1':'#e7d2b4'} emissive={state.gate?'#81702c':'#000000'} side={THREE.DoubleSide}/></mesh>
 <Html position={[0,1,-17]} center distanceFactor={16}><span className="g3-world-label">{state.gate?'MEET HERE TO FINISH':'VILLAGE EXIT'}</span></Html>
 <mesh position={[0,.08,-7]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1,24]}/><meshStandardMaterial color={state.checkpoint?'#89d3b4':'#cbb5df'}/></mesh>
 <Windmill/>
 {[[-13,0,13],[-12,0,5],[-14,0,0],[-4,0,16],[13,0,15],[14,0,0],[14,0,-15],[-5,0,-17],[-14,0,-11]].map((pos,i)=><Tree key={i} position={pos as Vec3} scale={.8+(i%3)*.16}/>)}
 {detail!=='low'&&Array.from({length:24},(_,i)=>{const x=Math.sin(i*12.7)*14,z=4+Math.cos(i*7.3)*8;return <mesh key={i} position={[x,.12,z]} rotation={[0,i,0]} scale={[.4,.22,.3]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2?'#e5c77e':'#b9c794'} flatShading/></mesh>})}
 <Html position={[-10,1.4,8]} center distanceFactor={14}><span className="g3-world-label">ORCHARD KEY · PLAYER 1</span></Html>
 <Html position={[9,6.2,-7]} center distanceFactor={14}><span className="g3-world-label">TOWER KEY · PLAYER 2</span></Html>
 </group>
}
