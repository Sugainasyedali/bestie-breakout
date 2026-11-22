import test from 'node:test';import assert from 'node:assert/strict';
import {catalog} from '../../shared/catalog.js';import {initBoard,boardAction} from '../../shared/content/engine.js';
test('60 stable catalog entries and ten levels per world',()=>{assert.equal(catalog.length,60);assert.equal(new Set(catalog.map(l=>l.id)).size,60);for(let w=0;w<6;w++)assert.equal(catalog.filter(l=>l.world===w).length,10)});
test('expert plates reject a late partner',()=>{const s=catalog[36].challenge!.stages[0],b=initBoard(s,0),flat=s.map.join('');b.actors[0]=flat.indexOf('a')-1;boardAction(s,b,0,1,0);b.actors[1]=flat.indexOf('b')+1;assert.equal(boardAction(s,b,1,3,2),'miss')});
test('expert plates accept coordinated arrivals',()=>{const s=catalog[36].challenge!.stages[0],b=initBoard(s,0),flat=s.map.join('');b.actors[0]=flat.indexOf('a')-1;boardAction(s,b,0,1,0);b.actors[1]=flat.indexOf('b')+1;assert.equal(boardAction(s,b,1,3,1),'done')});
test('timed cargo rejects expired assistance without moving the crate',()=>{
 const s=catalog.slice(36).flatMap(l=>l.challenge!.stages).find(s=>s.mode==='conveyor'&&s.labels?.includes('Timed'))!;
 const b=initBoard(s,0);b.actors[0]=b.box-1;const original=b.box;
 boardAction(s,b,1,4,0);assert.equal(boardAction(s,b,0,1,2),'miss');assert.equal(b.box,original);
 boardAction(s,b,1,4,2);assert.equal(boardAction(s,b,0,1,2.5),'move');assert.notEqual(b.box,original);
});
test('rhythm requires timely confirmation from the other player',()=>{
 const s=catalog[36].challenge!.stages.at(-1)!,b=initBoard(s,0,()=>0),symbol=b.code[0];
 boardAction(s,b,0,symbol,0);assert.equal(boardAction(s,b,1,symbol,2),'miss');assert.equal(b.step,0);
 boardAction(s,b,0,symbol,2);assert.equal(boardAction(s,b,1,symbol,2.3),'move');assert.equal(b.step,1);
});
test('database upgrade seeds sixty levels and preserves existing level rows',async()=>{
 const {PGlite}=await import('@electric-sql/pglite');const {migrate}=await import('../../db/setup.js');
 const db=new PGlite();
 const q=async(sql:string,params?:any[])=>{
   if(sql.includes('pg_advisory_xact_lock'))return {rows:[]};
   if(!params&&sql.includes('CREATE TABLE')){await db.exec(sql);return {rows:[]}}
   return db.query(sql,params);
 };
 try{await migrate(q);await migrate(q);
 const result=await db.query<{count:number}>('select count(*)::int as count from bestie.game_levels');assert.equal(result.rows[0].count,60);
 const groups=await db.query<{count:number}>('select count(*)::int as count from bestie.game_levels group by world_id');assert.ok(groups.rows.every(r=>r.count===10));
 }finally{await db.close()}
});
