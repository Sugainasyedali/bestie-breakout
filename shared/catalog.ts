import {missions} from './model.js';
import {levels as castle} from './content/castle.js';
import {levels as toy} from './content/toy.js';
import {levels as woods} from './content/woods.js';
import {levels as arcade} from './content/arcade.js';
import {levels as cloud} from './content/cloud.js';
import {levels as pizza} from './content/pizza.js';
import type {Challenge} from './content/engine.js';
export const worlds=['Castle of Chaos','Toy Factory Mayhem','Whispering Woods','Neon Memory Arcade','Cloud Kingdom','Pizza Panic City'];
export const descriptions=['Unlock the clockwork gates of a royal obstacle course.','Keep an eccentric assembly line moving together.','Find your partner through lantern-lit forest paths.','Trade clues under the lights of a midnight arcade.','Ride the wind between drifting islands.','Run a kitchen from the first order to opening night.'];
const packs=[castle,toy,woods,arcade,cloud,pizza];
export const slug=(name:string)=>name.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
const original=worlds.flatMap((_,w)=>[null,...packs[w]].map((challenge:Challenge|null,k)=>{
 const title=challenge?.title??missions[w][0];return {id:w*6+k+1,world:w,title,slug:slug(title),objective:challenge?.objective??missions[w][1],difficulty:Math.min(5,1+Math.floor((k+w)/2)),limit:challenge?.limit??[90,100,80,90,100,60][w],challenge}
}));
const expertNames=[
["Pendulum Partners","Royal Counterweight","Crown Relay","Siege of Seconds"],
["Pressure Line","Polarity Lock","Assembly Overtime","Midnight Recall"],
["Lantern Pact","Thornbound Twins","Echoes of Midnight","Guardian's Trial"],
["Double Tempo","Prism Protocol","Neon Deadlock","Final Combo"],
["Tethered Ascent","Cyclone Relay","Thunder Twins","Eye of the Storm"],
["Rush Hour Relay","Double Oven","Midnight Banquet","Besties Grand Finale"]];
const extra=worlds.flatMap((_,world)=>expertNames[world].map((title,k)=>{
 const stages:Challenge["stages"]=[];
 for(let section=0;section<3;section++){
 const width=11+k*2,rows=5+section*2;
 const map:string[][]=Array.from({length:rows},(_,y)=>Array.from({length:width},(_,x)=>x===0||x===width-1||y===0||y===rows-1?'#':'.'));
 map[1][1]='A';map[1][width-2]='B';map[rows-2][width-2]='a';map[rows-2][1]='b';
 for(let y=2;y<rows-2;y++)for(let x=2;x<width-2;x++)if(x%3===0&&y%2===0)map[y][x]='#';
 stages.push({mode:'pads',map:map.map(r=>r.join('')),labels:['Synchronized'],hint:'Both reach your plates within 1.2 seconds. Count down together. An early arrival resets both positions.'});
 stages.push({mode:'rhythm',map:['#########','#A.....B#','#.......#','#########'],code:Array.from({length:6+k+section},(_,i)=>(i*i+world+i*section+k)%4),hint:'Alternate sending and confirming symbols. Confirm each signal within 1.2 seconds.'});
 }
 // Expert gauntlets combine the world's existing mechanics with timed bookends.
 const pool=packs[world].flatMap(level=>level.stages).filter(stage=>stage.mode!=='pads');
 const mechanics=Array.from({length:4},(_,j)=>{
   const stage=structuredClone(pool[(k+j)%pool.length]);
   if(stage.mode==='route'||['cargo','conveyor','magnet'].includes(stage.mode)){
     stage.labels=[...(stage.labels??[]),'Timed'];
     stage.hint+=' Coordinate each authorization: your partner must act within 1.2 seconds.';
   }
   if(stage.mode==='sequence')stage.code=[...(stage.code??[]),k%4,(world+k)%4];
   return stage;
 });
 stages.splice(1,4,...mechanics);
 return {id:37+world*4+k,world,title,slug:slug(title),objective:'Cross together, coordinate four world-specific mechanisms, then finish an alternating signal lock.',difficulty:5,limit:150-k*12,challenge:{title,objective:'Finish all six coordination stages.',limit:150-k*12,stages}}
}));
export const catalog=[...original,...extra];
export const badges=['First Adventure','Perfect Pair','Unstoppable Duo','Memory Masters','Speed Demons','No Braincells Needed','World Explorer','Bestie Forever'];
export const badgeHints=['Clear a level.','Clear a level without mistakes.','Clear six different levels in one session.','Clear every level in Neon Memory Arcade.','Beat half the level time limit.','Win after five or more mistakes.','Complete all ten levels in any world.','Clear all 60 levels with a partner.'];
