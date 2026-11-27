"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html,useAnimations,useGLTF} from '@react-three/drei';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import type {Adventurer as State} from '../../../shared/game3d/types';
import type {Player} from '../../../shared/model';
export function Adventurer({state,player,local,onPosition,reaction}:{state:State;player:Player;local:boolean;onPosition?:(v:THREE.Vector3)=>void;reaction?:string}){
 const gltf=useGLTF(player.shape==='Sprout'?'/assets/characters/fern.glb':'/assets/characters/pip.glb');
 const model=useMemo(()=>{const result=clone(gltf.scene);result.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(o.material instanceof THREE.MeshStandardMaterial){o.material=o.material.clone();if(o.material.name==='clothing')o.material.color.set(player.color)}}});return result},[gltf.scene,player.color]);
 const group=useRef<THREE.Group>(null),initialized=useRef(false),lastMotion=useRef('');
 const {actions}=useAnimations(gltf.animations,model);
 const motion=state.motion==='idle'&&reaction?reaction==='😂'?'laugh':reaction==='😭'?'cry':reaction==='🤔'?'confused':'wave':state.motion;
 useEffect(()=>{const action=actions[motion]??actions.idle;if(lastMotion.current===motion)return;const previous=actions[lastMotion.current];previous?.fadeOut(.18);action?.reset().fadeIn(.18).play();lastMotion.current=motion;return()=>{action?.fadeOut(.18)}},[motion,actions]);
 useFrame((_,delta)=>{if(!group.current)return;const desired=new THREE.Vector3(...state.position);desired.y-=.7;const distance=group.current.position.distanceTo(desired);if(!initialized.current||distance>5){group.current.position.copy(desired);initialized.current=true}else group.current.position.lerp(desired,1-Math.exp(-delta*18));const angle=THREE.MathUtils.euclideanModulo(state.yaw-group.current.rotation.y+Math.PI,Math.PI*2)-Math.PI;group.current.rotation.y+=angle*(1-Math.exp(-delta*14));onPosition?.(group.current.position)});
 return <group ref={group}><primitive object={model}/>{player.cosmetic&&<mesh position={[0,1.96,0]} castShadow><cylinderGeometry args={[.25,.3,.16,8]}/><meshStandardMaterial color={player.cosmetic.includes('gold')?'#ffce69':'#a58aca'}/></mesh>}<Html position={[0,2.35,0]} center distanceFactor={12}><div className={'g3-name '+(local?'is-local':'')}>{reaction&&<b>{reaction}</b>}{player.name}{local?' · YOU':''}</div></Html></group>
}
