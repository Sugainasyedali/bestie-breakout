export type Vec3 = [number, number, number];
export type Motion = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'land' | 'climb' | 'carry' | 'interact' | 'celebrate';
export type Input3D = { x:number; z:number; climb:number; jump:boolean; sprint:boolean; seq:number; round:number };
export type Adventurer = { position:Vec3; yaw:number; motion:Motion; grounded:boolean; carrying:string|null; climbing:boolean; checkpoint:Vec3; ack:number; respawns:number };
export type KeyState = { id:string; position:Vec3; holder:number|null; delivered:boolean };
export type AdventureState = { version:4; level:'pinewood-01'; tick:number; players:Adventurer[]; keys:KeyState[]; ladder:boolean; ladderLatched:boolean; plate:boolean; gate:boolean; checkpoint:boolean; elapsed:number; hint:string };
export type Block = { id:string; position:Vec3; size:Vec3; color:string; kind?:'ground'|'wood'|'stone'|'house'|'gate' };
