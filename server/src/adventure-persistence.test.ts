import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {migrate} from '../../db/setup.js';
import {saveAttempt,type Attempt} from '../../shared/database.js';
test('versioned 3D attempts save both players and retain classic progress across migrations',async()=>{
 const db=new PGlite();
 const q=async(sql:string,params?:any[])=>{if(sql.includes('pg_advisory_xact_lock'))return{rows:[]};if(!params&&sql.includes('CREATE TABLE')){await db.exec(sql);return{rows:[]}}return db.query(sql,params)};
 try{
 await migrate(q);
 const ids=[randomUUID(),randomUUID()];for(let i=0;i<2;i++)await q('insert into bestie.player_profiles(id,auth_user_id,username,display_name) values($1,$2,$3,$4)',[ids[i],'auth-'+i,'bestie_'+i,'Bestie '+i]);
 const now=new Date().toISOString();const base:Attempt={id:randomUUID(),session:randomUUID(),round:1,level:2,hash:'test',host:ids[0],start:now,end:now,outcome:'win',seconds:70,score:80,stars:2,mistakes:0,players:ids.map((user,i)=>({user,guest:'guest'+i,character:'Bunny',role:i}))};
 await saveAttempt(base,{query:q} as any);
 await migrate(q);
 const current={...base,id:randomUUID(),session:randomUUID(),level:1,seconds:150,contentVersion:4,limit:420};
 await saveAttempt(current,{query:q} as any);await saveAttempt(current,{query:q} as any);
 const rows=(await q('select user_id,level_id,completion_count from bestie.player_level_progress order by user_id,level_id')).rows;assert.equal(rows.length,4);assert.ok(rows.every((r:any)=>r.completion_count===1));
 const attempt=(await q('select content_version from bestie.level_attempts where id=$1',[current.id])).rows[0] as any;assert.equal(attempt.content_version,4);
 assert.equal((await q('select * from bestie.game_level_versions where level_id=1')).rows.length,2);
 }finally{await db.close()}
});
