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
export const catalog=worlds.flatMap((_,w)=>[null,...packs[w]].map((challenge:Challenge|null,k)=>{
 const title=challenge?.title??missions[w][0];return {id:w*6+k+1,world:w,title,slug:slug(title),objective:challenge?.objective??missions[w][1],difficulty:Math.min(5,1+Math.floor((k+w)/2)),limit:challenge?.limit??[90,100,80,90,100,60][w],challenge}
}));
export const badges=['First Adventure','Perfect Pair','Unstoppable Duo','Memory Masters','Speed Demons','No Braincells Needed','World Explorer','Bestie Forever'];
export const badgeHints=['Clear a level.','Clear a level without mistakes.','Clear six different levels in one session.','Clear every level in Neon Memory Arcade.','Beat half the level time limit.','Win after five or more mistakes.','Complete all six levels in any world.','Clear all 36 levels with a partner.'];
