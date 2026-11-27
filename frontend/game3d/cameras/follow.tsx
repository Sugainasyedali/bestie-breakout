import {useFrame,useThree} from '@react-three/fiber';
import {useEffect,useMemo,type MutableRefObject} from 'react';
import * as THREE from 'three';
import {villageBlocks} from '../../../shared/game3d/village';
export type CameraRig={yaw:number;pitch:number;distance:number};
export function FollowCamera({target,rig,open}:{target:MutableRefObject<THREE.Vector3>;rig:MutableRefObject<CameraRig>;open:boolean}){
 const {camera,gl}=useThree();const boxes=useMemo(()=>villageBlocks.filter(b=>b.kind!=='ground').map(b=>({id:b.id,box:new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...b.position),new THREE.Vector3(...b.size))})),[]);
 useEffect(()=>{const el=gl.domElement;let previous:{x:number;y:number}|null=null;
 const down=(e:PointerEvent)=>{previous={x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId)};
 const move=(e:PointerEvent)=>{if(!previous)return;rig.current.yaw-=(e.clientX-previous.x)*.006;rig.current.pitch=THREE.MathUtils.clamp(rig.current.pitch+(e.clientY-previous.y)*.005,.12,1.12);previous={x:e.clientX,y:e.clientY}};
 const up=()=>previous=null;const wheel=(e:WheelEvent)=>{e.preventDefault();rig.current.distance=THREE.MathUtils.clamp(rig.current.distance+e.deltaY*.008,3.5,12)};
 el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:false});return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('wheel',wheel)};
 },[gl,rig]);
 useFrame((_,delta)=>{const r=rig.current,focus=target.current.clone().add(new THREE.Vector3(0,1.1,0)),offset=new THREE.Vector3(Math.sin(r.yaw)*Math.cos(r.pitch),Math.sin(r.pitch),Math.cos(r.yaw)*Math.cos(r.pitch));const ray=new THREE.Ray(focus,offset);let distance=r.distance;for(const {id,box} of boxes){if(id==='gate'&&open)continue;const hit=ray.intersectBox(box,new THREE.Vector3());if(hit)distance=Math.min(distance,Math.max(.7,hit.distanceTo(focus)-.25));}camera.position.lerp(focus.clone().addScaledVector(offset,distance),1-Math.exp(-delta*9));camera.lookAt(focus)});
 return null;
}
