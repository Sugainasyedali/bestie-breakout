import RAPIER from '@dimforge/rapier3d-compat';
import type {AdventureState,Input3D,Vec3} from '../../../shared/game3d/types.js';
import {village,villageBlocks,interaction,nearby} from '../../../shared/game3d/village.js';
await RAPIER.init();
export const idleInput=():Input3D=>({x:0,z:0,climb:0,jump:false,sprint:false,seq:0,round:0});
/** Fixed-step authoritative Rapier world. Clients submit directions, never positions. */
export class VillageSimulation {
 readonly world=new RAPIER.World({x:0,y:-20,z:0});
 readonly state:AdventureState;
 private bodies:RAPIER.RigidBody[]=[];
 private colliders:RAPIER.Collider[]=[];
 private controllers:RAPIER.KinematicCharacterController[]=[];
 private velocities=[{x:0,y:0,z:0},{x:0,y:0,z:0}];
 private gate:RAPIER.Collider;
 private actionUntil=[0,0];
 constructor(){
  let gate!:RAPIER.Collider;
  for(const block of villageBlocks){const c=this.world.createCollider(RAPIER.ColliderDesc.cuboid(...block.size.map(n=>n/2) as Vec3).setTranslation(...block.position));if(block.id==='gate')gate=c;}
  this.gate=gate;
  this.state={version:4,level:'pinewood-01',tick:0,players:village.spawns.map(position=>({position:[...position],yaw:Math.PI,motion:'idle',grounded:false,carrying:null,climbing:false,checkpoint:[...position],ack:0,respawns:0})),keys:village.keySpawns.map((position,i)=>({id:village.requiredItems[i],position:[...position],holder:null,delivered:false})),ladder:false,ladderLatched:false,plate:false,gate:false,checkpoint:false,elapsed:0,hint:village.objective};
  for(const position of village.spawns){
   const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(...position));
   const collider=this.world.createCollider(RAPIER.ColliderDesc.capsule(.42,.28),body);
   const controller=this.world.createCharacterController(.015);controller.enableAutostep(.35,.2,false);controller.enableSnapToGround(.25);controller.setMaxSlopeClimbAngle(Math.PI/4);controller.setMinSlopeSlideAngle(Math.PI/3);
   this.bodies.push(body);this.colliders.push(collider);this.controllers.push(controller);
  }
  this.world.step();
 }
 interact(seat:number,drop=false){
  const s=this.state,p=s.players[seat];if(!p||s.elapsed<this.actionUntil[seat])return false;
  if(drop){if(!p.carrying||!p.grounded||p.climbing)return false;const key=s.keys.find(k=>k.id===p.carrying)!;key.holder=null;key.position=[p.position[0],p.position[1]-.3,p.position[2]];p.carrying=null;this.actionUntil[seat]=s.elapsed+.25;return true;}
  const target=interaction(s,seat);if(!target)return false;
  if(target.id==='socket'){const key=s.keys[seat];key.delivered=true;key.holder=null;key.position=[...village.sockets[seat]];p.carrying=null;s.gate=s.keys.every(k=>k.delivered);this.gate.setEnabled(!s.gate);}
  else if(target.id==='latch')s.ladderLatched=true;
  else if(target.id==='ladder'){p.climbing=!p.climbing;this.velocities[seat]={x:0,y:0,z:0};}
  else {const key=s.keys[seat];key.holder=seat;p.carrying=key.id;}
  this.actionUntil[seat]=s.elapsed+.3;p.motion='interact';return true;
 }
 step(inputs:Input3D[],dt=1/40){
  const s=this.state;s.tick++;s.elapsed+=dt;this.world.timestep=dt;
  s.plate=s.players.some(p=>nearby(p.position,village.plate,1.4)&&p.grounded);
  s.ladder=s.plate||s.ladderLatched;
  for(let i=0;i<2;i++){
   const p=s.players[i],input=inputs[i]??idleInput(),body=this.bodies[i],v=this.velocities[i],old=body.translation();
   p.ack=input.seq;
   if(p.climbing){
    if(!s.ladder){p.climbing=false;}
    else {const y=Math.max(.75,old.y+input.climb*2.7*dt);if(y>=4.8){body.setNextKinematicTranslation({x:9,y:4.8,z:-3.65});p.climbing=false;}else if(y<=.8&&input.climb<0){body.setNextKinematicTranslation({x:9,y:.9,z:-1.6});p.climbing=false;}else{body.setNextKinematicTranslation({x:9,y,z:-2.4});p.motion='climb';}input.jump=false;continue;}
   }
   const length=Math.max(1,Math.hypot(input.x,input.z)),speed=p.carrying?3.5:input.sprint?6.5:4.3;
   v.x+=(input.x/length*speed-v.x)*Math.min(1,dt*13);v.z+=(input.z/length*speed-v.z)*Math.min(1,dt*13);
   if(input.jump&&p.grounded){v.y=7.7;p.grounded=false;}input.jump=false;
   v.y=Math.max(-20,v.y-20*dt);
   const c=this.controllers[i];c.computeColliderMovement(this.colliders[i],{x:v.x*dt,y:v.y*dt,z:v.z*dt},undefined,undefined,collider=>collider!==this.colliders[1-i]);
   const motion=c.computedMovement();body.setNextKinematicTranslation({x:old.x+motion.x,y:old.y+motion.y,z:old.z+motion.z});
   const wasGrounded=p.grounded;p.grounded=c.computedGrounded();if(p.grounded)v.y=0;
   const moving=Math.hypot(v.x,v.z)>.3;if(moving)p.yaw=Math.atan2(v.x,v.z);
   p.motion=s.elapsed<this.actionUntil[i]?'interact':!p.grounded?v.y>0?'jump':'fall':!wasGrounded?'land':moving?p.carrying?'carry':input.sprint?'run':'walk':'idle';
  }
  this.world.step();
  for(let i=0;i<2;i++){
   const p=s.players[i],t=this.bodies[i].translation();p.position=[t.x,t.y,t.z];
   if(t.y<-.8||Math.abs(t.x)>18||Math.abs(t.z)>23){p.position=[...p.checkpoint];this.bodies[i].setTranslation({x:p.position[0],y:p.position[1],z:p.position[2]},true);this.bodies[i].setNextKinematicTranslation({x:p.position[0],y:p.position[1],z:p.position[2]});p.climbing=false;p.grounded=false;p.respawns++;this.velocities[i]={x:0,y:0,z:0};}
   if(p.carrying)s.keys[i].position=[p.position[0],p.position[1]+.35,p.position[2]+.5];
  }
  if(!s.checkpoint&&s.players.every(p=>nearby(p.position,village.checkpoint,3))){s.checkpoint=true;s.players.forEach((p,i)=>p.checkpoint=[i?1:-1,.85,-7]);}
  s.hint=s.gate?'Gate open! Both besties must reach the glowing exit.':s.keys.every(k=>k.holder!==null||k.delivered)?'Bring your keys to the two locks beside the gate.':s.ladderLatched?'Ladder secured. Find both keys and bring them to the gate.':s.plate?'Ladder lowered! Your bestie can climb now.':'Split up: orchard key to the left; tower key across the river. Hold the plate to lower the ladder.';
  const win=s.gate&&s.players.every(p=>Math.hypot(p.position[0]-village.exit.x,p.position[2]-village.exit.z)<village.exit.radius&&p.position[1]<2);
  if(win)s.players.forEach(p=>p.motion='celebrate');return win;
 }
 dispose(){this.world.free()}
}
