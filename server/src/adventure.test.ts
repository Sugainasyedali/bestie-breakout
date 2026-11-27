import test from 'node:test';
import assert from 'node:assert/strict';
import {VillageSimulation,idleInput} from './game3d/simulation.js';
import {village} from '../../shared/game3d/village.js';

function frames(sim:VillageSimulation,n:number){for(let i=0;i<n;i++)sim.step([idleInput(),idleInput()]);}
function walk(sim:VillageSimulation,seat:number,x:number,z:number){for(let step=0;step<1000;step++){
 const p=sim.state.players[seat],dx=x-p.position[0],dz=z-p.position[2],distance=Math.hypot(dx,dz);if(distance<.16){frames(sim,12);return;}
 const inputs=[idleInput(),idleInput()];inputs[seat].x=dx/Math.max(1,distance);inputs[seat].z=dz/Math.max(1,distance);sim.step(inputs);
 }assert.fail(`Unreachable ${seat} ${x},${z} from ${sim.state.players[seat].position}`)}

test('village physics validates collection, cooperation, ladder, gate and shared exit',()=>{
 const sim=new VillageSimulation();try{
 frames(sim,30);assert.ok(sim.state.players.every(p=>p.grounded));
 assert.equal(sim.interact(0),false,'remote key collection rejected');
 walk(sim,0,-10,12);walk(sim,0,-10,5);assert.ok(sim.interact(0));assert.equal(sim.state.keys[0].holder,0);
 walk(sim,0,-10,12);walk(sim,0,4,12);walk(sim,0,4,1);assert.ok(sim.state.plate);
 walk(sim,1,5,12);walk(sim,1,5,3);walk(sim,1,9,3);walk(sim,1,9,-1.6);assert.ok(sim.interact(1));assert.ok(sim.state.players[1].climbing);
 for(let i=0;i<90;i++){const inputs=[idleInput(),idleInput()];inputs[1].climb=1;sim.step(inputs)}
 assert.ok(sim.state.players[1].position[1]>4);assert.equal(sim.state.players[1].climbing,false);
 walk(sim,1,9,-5);assert.ok(sim.interact(1));assert.ok(sim.state.ladderLatched);
 walk(sim,1,9,-7);assert.ok(sim.interact(1));assert.equal(sim.state.keys[1].holder,1);
 walk(sim,1,9,-3.65);assert.ok(sim.interact(1));
 for(let i=0;i<90;i++){const inputs=[idleInput(),idleInput()];inputs[1].climb=-1;sim.step(inputs)}
 walk(sim,1,9,1);walk(sim,1,0,1);walk(sim,1,0,-7);
 walk(sim,1,1,-10);assert.ok(sim.interact(1));assert.equal(sim.state.gate,false);
 walk(sim,0,0,1);walk(sim,0,0,-7);walk(sim,0,-1,-10);assert.ok(sim.interact(0));assert.ok(sim.state.gate);
 walk(sim,0,-1,-17);assert.equal(sim.step([idleInput(),idleInput()]),false,'one bestie cannot finish alone');
 walk(sim,1,1,-17);assert.ok(sim.step([idleInput(),idleInput()]));assert.ok(sim.state.players.every(p=>p.motion==='celebrate'));
 assert.equal(sim.state.players.reduce((n,p)=>n+p.respawns,0),0);
 }finally{sim.dispose()}
});
test('gravity, grounded jumping, collision and falling respawn are server controlled',()=>{
 const sim=new VillageSimulation();try{frames(sim,20);const y=sim.state.players[0].position[1];const inputs=[{...idleInput(),jump:true},idleInput()];sim.step(inputs);assert.ok(sim.state.players[0].position[1]>y);assert.equal(inputs[0].jump,false);frames(sim,80);assert.ok(sim.state.players[0].grounded);
 walk(sim,0,0,-9);for(let i=0;i<200;i++)sim.step([{...idleInput(),z:-1},idleInput()]);assert.ok(sim.state.players[0].position[2]>-12,'closed gate blocks crossing');
 const falls=sim.state.players[1].respawns;for(let i=0;i<250;i++)sim.step([idleInput(),{...idleInput(),x:1}]);assert.ok(sim.state.players[1].respawns>falls);
 }finally{sim.dispose()}
});
test('a partner must hold the plate and each key belongs to a different adventurer',()=>{
 const sim=new VillageSimulation();try{frames(sim,20);walk(sim,0,5,12);walk(sim,0,5,3);walk(sim,0,9,3);walk(sim,0,9,-1.6);assert.equal(sim.interact(0),false);assert.equal(sim.state.ladder,false);
 walk(sim,1,-10,12);walk(sim,1,-10,5);assert.equal(sim.interact(1),false);assert.equal(sim.state.keys[0].holder,null);
 }finally{sim.dispose()}
});
