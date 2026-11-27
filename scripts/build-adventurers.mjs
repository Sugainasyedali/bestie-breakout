/** Original generated assets. No external meshes, textures or animation data. */
import * as T from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {mkdir,writeFile} from 'node:fs/promises';
class Reader {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:application/octet-stream;base64,'+Buffer.from(result).toString('base64');this.onloadend?.()})}}
globalThis.FileReader=Reader;
const directory=new URL('../frontend/public/assets/characters/',import.meta.url);await mkdir(directory,{recursive:true});
for(const [name,hairColor,shirt,skin,style] of [['pip','#543c38','#e88b79','#e8b18b',0],['fern','#293f42','#73ada0','#b97855',1]]){
 const scene=new T.Scene();
 const bones=[],positions={root:[0,0,0],hips:[0,.78,0],chest:[0,1.12,0],head:[0,1.53,0],armL:[-.29,1.18,0],armR:[.29,1.18,0],legL:[-.14,.7,0],legR:[.14,.7,0]};
 for(const [id,pos] of Object.entries(positions)){const bone=new T.Bone();bone.name=id;bone.position.fromArray(pos);bones.push(bone)}
 const root=bones[0];for(const bone of bones.slice(1))root.add(bone);scene.add(root);scene.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);
 function part(id,bone,geo,pos,scale,color){geo.scale(...scale);geo.translate(...pos);const count=geo.attributes.position.count,indices=[],weights=[];for(let i=0;i<count;i++){indices.push(Object.keys(positions).indexOf(bone),0,0,0);weights.push(1,0,0,0)}geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));const material=new T.MeshStandardMaterial({color,roughness:.86});material.name=id==='tunic'?'clothing':id;const mesh=new T.SkinnedMesh(geo,material);mesh.name=id;mesh.bind(skeleton);scene.add(mesh)}
 const box=()=>new T.BoxGeometry(1,1,1),ball=()=>new T.SphereGeometry(1,12,8);
 part('tunic','chest',ball(),[0,1.05,0],[.32,.36,.23],shirt);
 part('belt','hips',box(),[0,.79,.005],[.48,.08,.39],'#655346');
 part('face','head',ball(),[0,1.53,.025],[.32,.34,.28],skin);
 part('hair','head',ball(),[0,1.72,-.025],[.335,.21,.29],hairColor);
 if(style)for(const side of [-1,1])part('hair-bun'+side,'head',ball(),[side*.27,1.77,-.08],[.16,.15,.16],hairColor);
 else part('fringe','head',ball(),[-.12,1.72,.21],[.22,.12,.12],hairColor);
 for(const side of [-1,1]){
 const suffix=side<0?'L':'R';
 part('ear'+suffix,'head',ball(),[side*.32,1.52,0],[.065,.095,.075],skin);
 part('eye'+suffix,'head',ball(),[side*.105,1.55,.28],[.037,.05,.023],'#25323b');
 part('glint'+suffix,'head',ball(),[side*.105+.009,1.565,.3],[.011,.014,.009],'#ffffff');
 part('cheek'+suffix,'head',ball(),[side*.19,1.45,.255],[.055,.028,.018],'#d98679');
 part('sleeve'+suffix,'arm'+suffix,ball(),[side*.32,1.12,0],[.13,.17,.14],shirt);
 part('arm'+suffix,'arm'+suffix,ball(),[side*.35,.95,0],[.085,.17,.085],skin);
 part('hand'+suffix,'arm'+suffix,ball(),[side*.35,.8,.015],[.095,.105,.095],skin);
 part('trouser'+suffix,'leg'+suffix,box(),[side*.14,.5,0],[.19,.34,.23],'#43576a');
 part('boot'+suffix,'leg'+suffix,ball(),[side*.14,.16,.055],[.13,.16,.21],'#6d5147');
 }
 part('nose','head',ball(),[0,1.48,.295],[.045,.04,.04],skin);
 part('smile','head',box(),[0,1.395,.28],[.09,.018,.018],'#784a47');
 part('backpack','chest',box(),[0,1.04,-.25],[.35,.4,.15],'#c9a25f');
 const clips=[];
 for(const state of ['idle','walk','run','jump','fall','land','climb','carry','interact','celebrate','wave','laugh','cry','confused']){
 const tracks=[],duration=state==='run'?.5:state==='walk'?.8:state==='climb'?1:state==='land'?.25:2;
 for(const bone of ['armL','armR','legL','legR','head','chest']){
 const values=[],times=[0,.25,.5,.75,1].map(t=>t*duration);
 for(let frame=0;frame<5;frame++){
 const t=frame/4*Math.PI*2,side=bone.endsWith('L')?1:-1;let x=0,y=0,z=0;
 if(['walk','run','carry'].includes(state)){if(bone.startsWith('leg'))x=Math.sin(t)*side*(state==='run'?.85:.5);if(bone.startsWith('arm'))x=state==='carry'?-1.2:-Math.sin(t)*side*.55;}
 if(state==='climb'&&(bone.startsWith('leg')||bone.startsWith('arm')))x=-.7+Math.sin(t)*side*.6;
 if(['jump','fall'].includes(state)){if(bone.startsWith('arm'))z=side*.8;if(bone.startsWith('leg'))x=.3;}
 if(state==='land'&&bone==='chest')x=Math.sin(t/2)*.3;
 if(['interact','wave'].includes(state)&&bone==='armR'){x=-1.4;z=Math.sin(t)*.25;}
 if(state==='celebrate'){if(bone.startsWith('arm'))z=side*(2.3+Math.sin(t)*.3);if(bone==='head')z=Math.sin(t)*.15;}
 if(state==='idle'&&bone==='chest')x=Math.sin(t)*.025;
 if(state==='laugh'&&bone==='chest')x=Math.sin(t*2)*.15;
 if(state==='cry'&&bone==='head')x=.4;
 if(state==='confused'&&bone==='head')z=Math.sin(t)*.25;
 const q=new T.Quaternion().setFromEuler(new T.Euler(x,y,z));values.push(q.x,q.y,q.z,q.w);
 }
 tracks.push(new T.QuaternionKeyframeTrack(bone+'.quaternion',times,values));
 }
 clips.push(new T.AnimationClip(state,duration,tracks));
 }
 const glb=await new GLTFExporter().parseAsync(scene,{binary:true,animations:clips});await writeFile(new URL(name+'.glb',directory),Buffer.from(glb));console.log(name,glb.byteLength,'bytes',clips.length,'skeletal clips');
}
