import type {Block,Vec3,AdventureState} from './types.js';
export const village = {
 id:'pinewood-01', contentVersion:4, legacyLevel:1, world:'Pinewood Adventure Village', title:'The Locked Village Gate',
 story:'The village gates have fallen asleep. Two old keys, and two brave besties, can wake them.',
 objective:'Find the orchard and tower keys. Deliver both to the gate, then leave together.',
 cooperativeActions:['Orchard explorer holds the ladder plate','Tower climber releases the ladder latch','Each adventurer delivers their own key','Both reach the village exit'],
 requiredItems:['orchard-key','tower-key'], limit:420, difficulty:1,
 failureConditions:['Timer expires'], hazards:['River','Falling beyond the island'],
 completion:'Both keys delivered and both players beyond the open gate',
 stars:{three:'Finish in 210 seconds with no falls',two:'Finish with fewer than four falls',one:'Finish together'},xp:50,
 assets:['/assets/characters/pip.glb','/assets/characters/fern.glb'],
 spawns:[[-2,.85,12],[2,.85,12]] as Vec3[],
 keySpawns:[[-10,1,5],[9,5,-7]] as Vec3[],
 plate:[4,.1,1] as Vec3, ladder:[9,2,-2.4] as Vec3, latch:[10.6,4.8,-5] as Vec3,
 sockets:[[-1,1,-10],[1,1,-10]] as Vec3[],
 checkpoint:[0,.1,-7] as Vec3,
 exit:{x:0,z:-17,radius:3.2},
};
export const villageBlocks:Block[]=[
 {id:'south',position:[0,-.6,8],size:[32,1.2,20],color:'#83b76c',kind:'ground'},
 {id:'north',position:[0,-.6,-12],size:[32,1.2,16],color:'#91bc76',kind:'ground'},
 {id:'bridge',position:[0,.05,-3],size:[4,.3,4],color:'#b88b5b',kind:'wood'},
 {id:'ladder-plinth',position:[9,0,-2.4],size:[2,.3,2],color:'#bba984',kind:'stone'},
 {id:'tower-deck',position:[9,3.8,-6],size:[6,.4,6],color:'#bf9061',kind:'wood'},
 {id:'tower-back',position:[9,4.35,-8.8],size:[6,.8,.25],color:'#866245',kind:'wood'},
 {id:'tower-left',position:[6.2,4.35,-6],size:[.25,.8,6],color:'#866245',kind:'wood'},
 {id:'tower-right',position:[11.8,4.35,-6],size:[.25,.8,6],color:'#866245',kind:'wood'},
 ...[-1,1].map((s):Block=>({id:'gate-wall'+s,position:[s*9,2,-12],size:[14,4,1],color:'#d4c6a4',kind:'stone'})),
 {id:'gate',position:[0,2,-12],size:[4,4,.6],color:'#765941',kind:'gate'},
 {id:'house-west',position:[-10,1.8,-8],size:[5,3.6,5],color:'#edd6a3',kind:'house'},
 {id:'house-east',position:[10,1.5,9],size:[5,3,4],color:'#e7bda3',kind:'house'},
 {id:'orchard-wall',position:[-7,.65,5],size:[.5,1.3,8],color:'#b4ab88',kind:'stone'},
 {id:'orchard-step',position:[-7,.25,10],size:[2,.5,2],color:'#bba984',kind:'stone'},
 ...[-1,1].flatMap(s=>[0,1].map((j):Block=>({id:`tower-post-${s}-${j}`,position:[9+s*2.5,1.8,-4-j*4],size:[.4,3.6,.4],color:'#7f6042',kind:'wood'}))),
];
export function nearby(a:Vec3,b:Vec3,r=1.9){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<r}
export function interaction(s:AdventureState,seat:number):{id:string;prompt:string}|null{
 const p=s.players[seat];if(!p)return null;
 if(p.carrying&&nearby(p.position,village.sockets[seat],2.3))return{id:'socket',prompt:'Place your key in the gate'};
 const key=s.keys[seat];if(!p.carrying&&!key.delivered&&key.holder===null&&nearby(p.position,key.position))return{id:key.id,prompt:seat?'Pick up the tower key':'Pick up the orchard key'};
 if(!s.ladderLatched&&nearby(p.position,village.latch))return{id:'latch',prompt:'Secure the ladder for your bestie'};
 if(s.ladder&&Math.abs(p.position[0]-9)<1.3&&Math.abs(p.position[2]+2.4)<1.6&&p.position[1]<5.1)return{id:'ladder',prompt:p.climbing?'Step off ladder':'Climb ladder · W / S'};
 return null;
}
