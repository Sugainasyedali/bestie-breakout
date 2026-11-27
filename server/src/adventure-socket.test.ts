import test from 'node:test';
import assert from 'node:assert/strict';
import {io} from 'socket.io-client';
import type {AddressInfo} from 'node:net';
import type {View} from '../../shared/model.js';
import {makeServer} from './index.js';
const sleep=(n:number)=>new Promise(r=>setTimeout(r,n));
async function until(f:()=>boolean,ms=10000){const end=Date.now()+ms;while(Date.now()<end){if(f())return;await sleep(25)}throw Error('3D socket state timed out')}
test('two independent clients complete the 3D village and restore a carrying player',{timeout:180000},async()=>{
 const server=makeServer();await new Promise<void>(resolve=>server.http.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+(server.http.address() as AddressInfo).port;
 const clients=[io(url,{forceNew:true}),io(url,{forceNew:true})],states:View[]=[];const seq=[0,0];clients.forEach((c,i)=>c.on('state',v=>states[i]=v));
 const profile={name:'Pip',shape:'Bunny',color:'#e88b79',avatar:'★'};
 function input(i:number,x=0,z=0,climb=0,jump=false){clients[i].emit('input3d',{x,z,climb,jump,sprint:true,seq:++seq[i],round:states[i].round})}
 async function walk(i:number,x:number,z:number){const end=Date.now()+20000;while(Date.now()<end){if(states[i].phase==='results')return;const p=states[i].adventure!.players[i],dx=x-p.position[0],dz=z-p.position[2],d=Math.hypot(dx,dz);if(d<.27){input(i);await sleep(220);return}input(i,dx/Math.max(1,d),dz/Math.max(1,d));await sleep(50)}assert.fail('Blocked path '+i+' '+x+','+z+' at '+states[i].adventure!.players[i].position)}
 async function interact(i:number){clients[i].emit('interact3d',{round:states[i].round,drop:false});await sleep(230)}
 try{
  const seat=await clients[0].emitWithAck('create',profile);const second=await clients[1].emitWithAck('join',{code:seat.code,profile:{...profile,name:'Fern',shape:'Sprout'}});
  clients.forEach(c=>c.emit('command','ready'));await until(()=>states[0]?.players.every(p=>p.ready));clients[0].emit('command','start3d');await until(()=>!!states[1]?.adventure);
  clients[0].emit('loaded',states[0].round);await sleep(100);assert.equal(states[0].intro,1.8);clients[1].emit('loaded',states[1].round);await until(()=>!states[0].intro&&!states[1].intro);
  const start=[...states[0].adventure!.players[0].position];clients[0].emit('input3d',{x:999,z:0,climb:0,jump:false,sprint:true,seq:1,round:states[0].round});await sleep(150);assert.equal(states[0].adventure!.players[0].position[0],start[0]);
  await interact(0);assert.ok(states[0].adventure!.keys.every(k=>k.holder===null));
  await walk(0,-10,12);await walk(0,-10,5);await interact(0);assert.equal(states[1].adventure!.keys[0].holder,0);
  clients[1].disconnect();await until(()=>!states[0].players[1].online);const elapsed=states[0].adventure!.elapsed;await sleep(200);assert.equal(states[0].adventure!.elapsed,elapsed);
  clients[1].connect();await until(()=>clients[1].connected);const restored=await clients[1].emitWithAck('restore',second);assert.equal(restored.id,second.id);await until(()=>states[0].players[1].online);assert.equal(states[1].adventure!.keys[0].holder,0);
  clients[0].emit('command','pause');await until(()=>states[1].paused);const paused=states[0].adventure!.elapsed;await interact(0);assert.equal(states[0].adventure!.elapsed,paused);clients[0].emit('command','pause');await until(()=>!states[1].paused);
  await walk(0,-10,12);await walk(0,4,12);await walk(0,4,1);await until(()=>states[1].adventure!.plate);
  await walk(1,5,12);await walk(1,5,3);await walk(1,9,3);await walk(1,9,-1.6);await interact(1);assert.ok(states[0].adventure!.players[1].climbing);
  for(let i=0;i<40;i++){input(1,0,0,1);await sleep(50)}input(1);await walk(1,10.6,-5);await interact(1);assert.ok(states[0].adventure!.ladderLatched,JSON.stringify(states[0].adventure));
  await walk(1,9,-7);await interact(1);assert.equal(states[0].adventure!.keys[1].holder,1);
  await walk(1,9,-3.65);await interact(1);for(let i=0;i<40;i++){input(1,0,0,-1);await sleep(50)}input(1);
  await walk(1,9,1);await walk(1,0,1);await walk(1,0,-7);await walk(1,1,-10);await interact(1);assert.equal(states[0].adventure!.gate,false);
  await walk(0,0,1);await walk(0,0,-7);await walk(0,-1,-10);await interact(0);assert.ok(states[1].adventure!.gate);
  await walk(0,-1,-17);assert.equal(states[0].phase,'game');await walk(1,1,-16);await until(()=>states.every(s=>s.phase==='results'));
  assert.deepEqual(states[0].history,states[1].history);assert.equal(states[0].history.at(-1)?.win,true);assert.ok(states[0].history.at(-1)!.seconds>0);
  assert.equal(states[0].saveStatus,'guest');
 }finally{clients.forEach(c=>c.disconnect());server.close()}
});
