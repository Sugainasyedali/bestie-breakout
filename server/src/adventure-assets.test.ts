import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('original GLB characters contain skinning and the animation clips used by gameplay',async()=>{
 for(const name of ['pip','fern']){
 const bytes=await readFile(new URL(`../../frontend/public/assets/characters/${name}.glb`,import.meta.url));
 assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.ok(json.skins.length>0);assert.ok(json.skins.every((s:any)=>s.joints.length>=8));assert.ok(json.meshes.every((m:any)=>m.primitives.every((p:any)=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined)));
 const clips=new Set(json.animations.map((a:any)=>a.name));for(const clip of ['idle','walk','run','jump','fall','land','climb','carry','interact','celebrate'])assert.ok(clips.has(clip),clip);
 assert.ok(bytes.length<400000,'keep generated models lightweight');
 }
});
