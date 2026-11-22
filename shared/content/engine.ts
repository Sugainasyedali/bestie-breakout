import {forestAction} from "./forest-effects.js";
export type Mode='pads'|'cargo'|'route'|'mirrors'|'sequence'|'wind'|'rhythm'|'build'|'magnet'|'gravity'|'conveyor';
export type Stage={mode:Mode,map:string[],labels?:string[],code?:number[],hint:string,role?:number};
export type Challenge={title:string,objective:string,limit:number,stages:Stage[]};
export type Board={stage:number,actors:[number,number],box:number,switchOn:boolean,armed:number,mirrors:number[],step:number,beat:number,marks:number[],code:number[],held:number,beam:number[],built:number[],sent:number,both:number,tiles:string[]};
export function initBoard(s:Stage,index:number,random:()=>number=Math.random):Board{
 const text=s.map.join(''),shift=Math.floor(random()*4);
 return {stage:index,actors:[text.indexOf('A'),text.indexOf('B')],box:text.indexOf('C'),switchOn:false,armed:-1,mirrors:[...text].flatMap((c,i)=>c==='/'||c==='\\'?[i]:[]),step:0,beat:0,marks:[],code:(s.code||[0,1,3,2]).map(n=>(n+shift)%4),held:-1,beam:[],built:[],sent:-1,both:0,tiles:[...s.map]};
}
export function cellAt(b:Board,i:number){return i<0?'#':b.tiles[Math.floor(i/b.tiles[0].length)]?.[i%b.tiles[0].length]||'#'}
export function neighbor(b:Board,i:number,n:number){const w=b.tiles[0].length;if((n===1&&i%w===w-1)||(n===3&&i%w===0))return -1;return i+[-w,1,w,-1][n]}
export function ray(b:Board){const path:number[]=[];let p=b.actors[0],d=1;const seen=new Set<number>();while(path.length<200){p=neighbor(b,p,d);const c=cellAt(b,p);if(c==='#'||seen.has(p*4+d))break;path.push(p);if(c==='G')break;seen.add(p*4+d);if(c==='/')d=[1,0,3,2][d];if(c==='\\')d=[3,2,1,0][d]}return path}
export type Verdict='move'|'miss'|'done'|'idle';
export function boardAction(s:Stage,b:Board,i:number,n:number,elapsed:number):Verdict{
 if(!Number.isInteger(n)||n<0||n>4)return 'idle';
 const forest=forestAction(s,b,i,n,elapsed);if(forest!==undefined)return forest;
 const mode=s.mode,runner=s.role??1,guide=1-runner;
 if(mode==='sequence'||mode==='rhythm'){
 if(n===4)return 'idle';
 // Each part needs a clue/ingredient from one seat, confirmed at the other.
 const sender=mode==='rhythm'?b.step%2:guide;
 if(i===sender){b.sent=n;b.beat=elapsed;return 'move'}
 if(b.sent<0)return 'idle';
 const ok=(mode!=='rhythm'||elapsed-b.beat<=1.2)&&n===b.code[b.step]&&n===b.sent&&(mode!=='rhythm'||Math.floor(elapsed*2)%4!==3);
 b.sent=-1;if(!ok){b.step=0;return 'miss'}return ++b.step===b.code.length?'done':'move';
 }
 if(mode==='mirrors'){
 if(n===4){if(i!==runner||!(b.both&(1<<guide)))return 'idle';b.beam=ray(b);return cellAt(b,b.beam.at(-1)??-1)==='G'?'done':'miss'}
 const pos=b.mirrors[n];if(pos===undefined||n%2!==i&&b.mirrors.length>1)return 'idle';
 const w=b.tiles[0].length,y=Math.floor(pos/w),x=pos%w,row=b.tiles[y];b.tiles[y]=row.slice(0,x)+(row[x]==='/'?'\\':'/')+row.slice(x+1);
 b.both|=1<<i;b.beam=ray(b);return 'move'
 }
 const freight=['cargo','magnet','conveyor'].includes(mode);
 if(freight&&n===4){b.armed=i;b.beat=elapsed;return 'move'}
 if(!freight&&mode!=='pads'&&i===guide){
 if(n===4){if(mode==='build')return 'idle';b.switchOn=!b.switchOn;b.both|=1<<guide;return 'move'}
 if(mode==='route'){b.held=n;b.beat=elapsed;b.both|=1<<guide;return 'move'}
 if(mode==='build'){const p=neighbor(b,b.actors[runner],n);if(cellAt(b,p)==='+'&&!b.built.includes(p)){b.built.push(p);b.both|=1<<guide;return 'move'}}
 return 'idle';
 }
 if(n===4)return 'idle';
 const dir=mode==='gravity'&&!s.labels?.includes('Bounce')&&b.switchOn?[2,1,0,3][n]:mode==='pads'&&s.labels?.includes('Mirror')&&i===1?[0,3,2,1][n]:n;
 const p=neighbor(b,b.actors[i],dir),c=cellAt(b,p);
 if(c==='#')return 'idle';
 if(mode==='route'&&(b.held!==dir))return 'idle';
 if(mode==='route'&&s.labels?.includes('Timed')&&elapsed-b.beat>1.2){b.held=-1;return 'miss'}
 if((c==='*'||c==='+')&&!b.switchOn&&!b.built.includes(p))return 'idle';
 if(c==='~'&&!b.switchOn){b.actors[i]=s.map.join('').indexOf(i?'B':'A');return 'miss'}
 if(freight&&p===b.box){
 if(b.armed!==1-i)return 'idle';
 if(s.labels?.includes('Timed')&&elapsed-b.beat>1.2){b.armed=-1;return 'miss'}
 let dest=neighbor(b,p,dir);if(cellAt(b,dest)==='#')return 'idle';
 if(cellAt(b,dest)==='~'){b.box=s.map.join('').indexOf('C');b.armed=-1;return 'miss'}
 if(mode==='conveyor'&&'><'.includes(cellAt(b,dest))){const slide=neighbor(b,dest,cellAt(b,dest)==='>'?1:3);if(cellAt(b,slide)!=='#')dest=slide}
 b.box=dest;b.armed=-1;b.both=3;
 }
 let landing=p;
 if(mode==='wind' && c==='~' && b.switchOn){const glide=neighbor(b,p,dir);if(cellAt(b,glide)!=='#')landing=glide;b.switchOn=false}
 if(mode==='magnet' && (!s.labels?.includes('Timed')||elapsed-b.beat<=1.2) && b.armed===1-i && b.box===neighbor(b,b.actors[i],(dir+2)%4)){b.box=b.actors[i];b.armed=-1;b.both=3}
 b.actors[i]=landing;
 if(mode==='route')b.held=-1;
 if(mode==='pads'&&s.labels?.includes('Synchronized')){
 const on=[cellAt(b,b.actors[0])==='a',cellAt(b,b.actors[1])==='b'];
 if(on.some(Boolean)&&!b.marks.length){b.marks=[i];b.beat=elapsed}
 if(b.marks.length&&elapsed-b.beat>1.2){b.actors=[s.map.join('').indexOf('A'),s.map.join('').indexOf('B')];b.marks=[];return 'miss'}
 }
 if(mode==='pads')return cellAt(b,b.actors[0])==='a'&&cellAt(b,b.actors[1])==='b'?'done':'move';
 if(freight)return cellAt(b,b.box)==='G'?'done':'move';
 return cellAt(b,landing)==='G'&&Boolean(b.both&(1<<guide))?'done':'move';
}
